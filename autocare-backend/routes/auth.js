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
// After 5 wrong passwords for one email, that email is locked for 15 minutes.
// The count is kept in the MySQL table `login_attempts`, so restarting the server
// does not reset it. A correct login clears the count.
const MAX_TRIES = 5;
const LOCK_MINUTES = 15;

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

// How many minutes this email is still locked for (0 = not locked)
async function minutesLocked(email) {
  const [rows] = await db.query(
    'SELECT TIMESTAMPDIFF(SECOND, NOW(), lockedUntil) AS secs FROM login_attempts WHERE email = ? AND lockedUntil > NOW()',
    [email]);
  return rows.length ? Math.max(1, Math.ceil(rows[0].secs / 60)) : 0;
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
      `UPDATE login_attempts SET fails = 0, lockedUntil = NOW() + INTERVAL ${LOCK_MINUTES} MINUTE WHERE email = ?`,
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
  const locked = await minutesLocked(email);
  if (locked) {
    return res.status(429).json({ error: `Too many wrong attempts. Try again in ${locked} minute${locked > 1 ? 's' : ''}.` });
  }

  // 2. Check the email and password
  const acc = await findAccount(email);
  if (!acc || !(await bcrypt.compare(password, acc.password))) {
    const left = await countWrongTry(email);
    if (left === 0) {
      return res.status(429).json({ error: `Too many wrong attempts. Try again in ${LOCK_MINUTES} minutes.` });
    }
    if (left <= 2) {
      return res.status(401).json({ error: `Wrong email or password. ${left} ${left > 1 ? 'tries' : 'try'} left before the account is locked for ${LOCK_MINUTES} minutes.` });
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

// GET /api/auth/me   (needs a token) — "is my login still valid?"
router.get('/me', requireAuth, (req, res) => {
  const { id, role, name, email } = req.user;
  res.json({ user: { id, role, name, email } });
});

module.exports = router;