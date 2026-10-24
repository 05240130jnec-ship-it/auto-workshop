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

// POST /api/auth/login   body: { email, password }
router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !password) return res.status(400).json({ error: 'Please enter your email and password.' });

  const acc = await findAccount(email);
  if (!acc || !(await bcrypt.compare(password, acc.password))) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
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