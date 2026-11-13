// routes/auth.js — login, signup and "who am I".
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

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
  const { name, phone, address, password } = req.body;
  const email = (req.body.email || '').trim().toLowerCase();
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
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

// POST /api/auth/google   body: { credential }
router.post('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Google login is not set up yet (GOOGLE_CLIENT_ID is missing in .env).' });
  const credential = String(req.body.credential || '');
  if (!credential) return res.status(400).json({ error: 'Google did not send a login. Please try again.' });

  // 1. Ask Google: is this token real?
  let info;
  try {
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
    info = await r.json();
    if (!r.ok) throw new Error(info.error_description || 'invalid token');
  } catch (err) {
    return res.status(401).json({ error: 'Google login failed. Please try again.' });
  }
  // 2. Was it made for our website, and is the email confirmed by Google?
  if (info.aud !== clientId) return res.status(401).json({ error: 'This Google login is not for AutoCare Pro.' });
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

// GET /api/auth/me   (needs a token) — "is my login still valid?"
router.get('/me', requireAuth, (req, res) => {
  const { id, role, name, email } = req.user;
  res.json({ user: { id, role, name, email } });
});

module.exports = router;