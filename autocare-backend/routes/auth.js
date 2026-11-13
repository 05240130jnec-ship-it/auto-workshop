// routes/auth.js — login, signup and "who am I".
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../mailer');
const { getSettings } = require('../settings');

const router = express.Router();

// Make a token that lasts 1 day
function makeToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// Find an account by email in the 3 user tables
async function findAccount(email) {
  const [a] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
  if (a.length) return { ...a[0], role: 'admin' };
  const [m] = await db.query('SELECT * FROM mechanics WHERE email = ?', [email]);
  if (m.length) return { ...m[0], role: 'mechanic' };
  const [c] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
  if (c.length) return { ...c[0], role: 'customer' };
  return null;
}

// ---------- Stop password guessing ----------
// After 5 wrong passwords for one email, that email is locked for 15 seconds.
// The count is kept in the MySQL table `login_attempts`, so restarting the server
// does not reset it. A correct login clears the count.
const MAX_TRIES = 5;
const LOCK_SECONDS = 15;

// Makes the table the first time someone logs in (so no extra setup step is needed)
let tableReady = null;
function setupAttemptsTable() {
  if (!tableReady) {
    tableReady = db.query(`CREATE TABLE IF NOT EXISTS login_attempts (
      email varchar(120) NOT NULL PRIMARY KEY,
      fails int NOT NULL DEFAULT 0,
      lockedUntil datetime DEFAULT NULL
    )`).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

// How many seconds this email is still locked for (0 = not locked)
async function secondsLocked(email) {
  const [rows] = await db.query(
    'SELECT TIMESTAMPDIFF(SECOND, NOW(), lockedUntil) AS secs FROM login_attempts WHERE email = ? AND lockedUntil > NOW()',
    [email]);
  return rows.length ? Math.max(1, Number(rows[0].secs)) : 0;
}

// Counts one wrong password. Returns how many tries are left (0 = now locked).
async function countWrongTry(email) {
  // a lock that has ended starts again from 0
  await db.query('UPDATE login_attempts SET fails = 0, lockedUntil = NULL WHERE email = ? AND lockedUntil <= NOW()', [email]);
  await db.query(
    'INSERT INTO login_attempts (email, fails) VALUES (?, 1) ON DUPLICATE KEY UPDATE fails = fails + 1',
    [email]);
  const [[row]] = await db.query('SELECT fails FROM login_attempts WHERE email = ?', [email]);
  if (row.fails >= MAX_TRIES) {
    await db.query(
      `UPDATE login_attempts SET fails = 0, lockedUntil = NOW() + INTERVAL ${LOCK_SECONDS} SECOND WHERE email = ?`,
      [email]);
    return 0;
  }
  return MAX_TRIES - row.fails;
}

// POST /api/auth/login   body: { email, password }
router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !password) return res.status(400).json({ error: 'Please enter your email and password.' });

  // 1. Locked? Then we do not even check the password.
  await setupAttemptsTable();
  const locked = await secondsLocked(email);
  if (locked) {
    return res.status(429).json({ error: `Too many wrong attempts. Try again in ${locked} second${locked > 1 ? 's' : ''}.`, wait: locked });
  }

  // 2. Check the email and password
  const acc = await findAccount(email);
  if (!acc || !(await bcrypt.compare(password, acc.password))) {
    const left = await countWrongTry(email);
    if (left === 0) {
      return res.status(429).json({ error: `Too many wrong attempts. Try again in ${LOCK_SECONDS} seconds.`, wait: LOCK_SECONDS });
    }
    if (left <= 2) {
      return res.status(401).json({ error: `Wrong email or password. ${left} ${left > 1 ? 'tries' : 'try'} left before the account is locked for ${LOCK_SECONDS} seconds.` });
    }
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  // 3. Right password: clear the wrong tries
  await db.query('DELETE FROM login_attempts WHERE email = ?', [email]);

  if (acc.role === 'customer' && acc.status === 'inactive') {
    return res.status(403).json({ error: 'This account is inactive. Please contact the workshop.' });
  }

  const user = { id: acc.id, role: acc.role, name: acc.name, email: acc.email };
  res.json({ token: makeToken(user), user });
});

// POST /api/auth/signup   body: { name, email, phone, address, password }
router.post('/signup', async (req, res) => {
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').replace(/[\s-]/g, '');
  const address = String(req.body.address || '').trim();
  const password = String(req.body.password || '');
  // The website checks these too, but someone could skip the website
  if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) return res.status(400).json({ error: 'Please enter your full name (letters and spaces only).' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!/^(\+?975)?[1-8]\d{7}$/.test(phone)) return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password needs at least 8 characters with a letter and a number.' });
  }
  if (await findAccount(email)) return res.status(409).json({ error: 'An account with this email already exists.' });

  // Next customer id: C-001, C-002 … → C-009
  const [rows] = await db.query("SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS n FROM customers");
  const id = 'C-' + String((rows[0].n || 0) + 1).padStart(3, '0');

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO customers (id, name, email, phone, address, password, status, joined) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())',
    [id, name, email, phone || null, address || null, hash, 'active']);

  const user = { id, role: 'customer', name, email };
  res.status(201).json({ token: makeToken(user), user });
});

// ---------- Continue with Google ----------
// The website shows Google's button. When the person picks their Google account, Google gives
// the website a "credential" (a signed ID token). We ask Google if that token is real and meant
// for OUR app (GOOGLE_CLIENT_ID in .env), then log the person in with the email inside it.
// A new email becomes a new customer account automatically.

// GET /api/auth/google-config — the website asks if Google login is set up
router.get('/google-config', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
});

// POST /api/auth/google   body: { accessToken }  (our Google button)  or  { credential }  (Google's own button)
router.post('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Google login is not set up yet (GOOGLE_CLIENT_ID is missing in .env).' });
  const credential = String(req.body.credential || '');
  const accessToken = String(req.body.accessToken || '');
  if (!credential && !accessToken) return res.status(400).json({ error: 'Google did not send a login. Please try again.' });

  // 1. Ask Google: is this token real? (and get the name + email)
  let info;
  try {
    const url = accessToken
      ? 'https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(accessToken)
      : 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential);
    const r = await fetch(url);
    info = await r.json();
    if (!r.ok) throw new Error(info.error_description || 'invalid token');
    if (accessToken) {
      // the access token does not contain the name, so ask Google for it
      const u = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + accessToken } });
      if (u.ok) { const me = await u.json(); info.name = me.name; info.email = info.email || me.email; }
    }
  } catch (err) {
    return res.status(401).json({ error: 'Google login failed. Please try again.' });
  }
  // 2. Was it made for our website, and is the email confirmed by Google?
  if (info.aud !== clientId && info.azp !== clientId) return res.status(401).json({ error: 'This Google login is not for AutoCare Pro.' });
  if (info.email_verified !== 'true' && info.email_verified !== true) {
    return res.status(401).json({ error: 'Your Google email is not verified.' });
  }
  const email = String(info.email || '').toLowerCase();
  const name = info.name || email.split('@')[0];

  // 3. Find the account, or make a new customer
  let acc = await findAccount(email);
  if (!acc) {
    const [rows] = await db.query("SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS n FROM customers");
    const id = 'C-' + String((rows[0].n || 0) + 1).padStart(3, '0');
    // They log in with Google, so we save a random password nobody knows (the column cannot be empty)
    const randomHash = await bcrypt.hash(require('crypto').randomBytes(24).toString('hex'), 10);
    await db.query(
      'INSERT INTO customers (id, name, email, phone, address, password, status, joined) VALUES (?, ?, ?, NULL, NULL, ?, ?, CURDATE())',
      [id, name, email, randomHash, 'active']);
    acc = { id, name, email, role: 'customer', status: 'active' };
  }
  if (acc.role === 'customer' && acc.status === 'inactive') {
    return res.status(403).json({ error: 'This account is inactive. Please contact the workshop.' });
  }
  await db.query('DELETE FROM login_attempts WHERE email = ?', [email]).catch(() => {});

  const user = { id: acc.id, role: acc.role, name: acc.name, email: acc.email };
  res.json({ token: makeToken(user), user });
});

// ---------- Forgot password: a 6-digit code by email ----------
// 1. POST /api/auth/forgot  { email }                    -> emails a 6-digit code (valid 10 minutes)
// 2. POST /api/auth/reset   { email, code, password }    -> sets the new password
// The code is saved as a bcrypt HASH in the MySQL table `password_resets` (never as plain text).
// The answer of step 1 is the same whether the email exists or not, so nobody can use this
// page to find out who has an account.
const CODE_MINUTES = 10;      // how long a code works
const CODE_TRIES = 5;         // wrong codes allowed before the code stops working
const RESEND_SECONDS = 60;    // wait between two codes for the same email
const TABLE_OF = { admin: 'admins', mechanic: 'mechanics', customer: 'customers' };

let resetsReady = null;
function setupResetsTable() {
  if (!resetsReady) {
    resetsReady = db.query(`CREATE TABLE IF NOT EXISTS password_resets (
      email varchar(120) NOT NULL PRIMARY KEY,
      codeHash varchar(255) NOT NULL,
      tries int NOT NULL DEFAULT 0,
      expiresAt datetime NOT NULL,
      createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch((err) => { resetsReady = null; throw err; });
  }
  return resetsReady;
}

// "Hello {name}, your code is {code}" -> the real name and code
const fill = (text, values) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));

router.post('/forgot', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  await setupResetsTable();

  // Same email asked less than 60 seconds ago? Ask them to wait.
  const [recent] = await db.query(
    'SELECT ? - TIMESTAMPDIFF(SECOND, createdAt, NOW()) AS wait FROM password_resets WHERE email = ? AND createdAt > NOW() - INTERVAL ? SECOND',
    [RESEND_SECONDS, email, RESEND_SECONDS]);
  if (recent.length) {
    const wait = Math.max(1, Number(recent[0].wait));
    return res.status(429).json({ error: `Please wait ${wait} seconds before asking for a new code.`, wait });
  }

  const acc = await findAccount(email);
  if (acc && !(acc.role === 'customer' && acc.status === 'inactive')) {
    const code = String(Math.floor(100000 + Math.random() * 900000));   // 6 digits
    await db.query(
      `INSERT INTO password_resets (email, codeHash, tries, expiresAt, createdAt)
       VALUES (?, ?, 0, NOW() + INTERVAL ${CODE_MINUTES} MINUTE, NOW())
       ON DUPLICATE KEY UPDATE codeHash = VALUES(codeHash), tries = 0, expiresAt = VALUES(expiresAt), createdAt = NOW()`,
      [email, await bcrypt.hash(code, 10)]);

    // The email text comes from MySQL (admin -> Website Content -> Login & profile)
    const s = await getSettings();
    const values = { name: acc.name.split(' ')[0], code, minutes: CODE_MINUTES };
    const text = fill(s.resetEmailText || 'Hello {name},\n\nYour AutoCare Pro password reset code is: {code}\n\nIt works for {minutes} minutes.', values);
    try {
      await sendMail({
        to: email,
        subject: fill(s.resetEmailSubject || 'Your password reset code', values),
        text,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2933">${text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(code, `<b style="font-size:26px;letter-spacing:6px;color:#f57c00">${code}</b>`)
          .replace(/\n/g, '<br>')}</div>`,
      });
    } catch (err) {
      console.error('Could not send the reset email:', err.message);
      await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
      return res.status(500).json({ error: 'We could not send the email right now. Please try again later.' });
    }
  }
  res.json({ ok: true, minutes: CODE_MINUTES });
});

router.post('/reset', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const password = String(req.body.password || '');
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Please enter the 6-digit code from the email.' });
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password needs at least 8 characters with a letter and a number.' });
  }
  await setupResetsTable();

  const [rows] = await db.query('SELECT codeHash, tries, expiresAt > NOW() AS valid FROM password_resets WHERE email = ?', [email]);
  const row = rows[0];
  if (!row || !Number(row.valid) || row.tries >= CODE_TRIES) {
    return res.status(400).json({ error: 'This code has expired. Please ask for a new code.' });
  }
  if (!(await bcrypt.compare(code, row.codeHash))) {
    await db.query('UPDATE password_resets SET tries = tries + 1 WHERE email = ?', [email]);
    const left = CODE_TRIES - row.tries - 1;
    return res.status(400).json({ error: left > 0 ? `Wrong code. ${left} ${left > 1 ? 'tries' : 'try'} left.` : 'Wrong code. Please ask for a new code.' });
  }

  const acc = await findAccount(email);
  if (!acc) return res.status(400).json({ error: 'This code has expired. Please ask for a new code.' });
  await db.query(`UPDATE ${TABLE_OF[acc.role]} SET password = ? WHERE id = ?`, [await bcrypt.hash(password, 10), acc.id]);
  await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
  await setupAttemptsTable();
  await db.query('DELETE FROM login_attempts WHERE email = ?', [email]);   // unlock the login too
  res.json({ ok: true });
});

// GET /api/auth/me   (needs a token) — "is my login still valid?"
router.get('/me', requireAuth, (req, res) => {
  const { id, role, name, email } = req.user;
  res.json({ user: { id, role, name, email } });
});

module.exports = router;