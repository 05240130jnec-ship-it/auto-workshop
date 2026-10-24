// Login, sign up and "who am I"
//   POST /api/auth/login    { email, password }
//   POST /api/auth/signup   { name, email, phone, address, password }
//   GET  /api/auth/me       (needs token)
//   POST /api/auth/change-password   { current, next }   (needs token)
//   POST /api/auth/forgot-password   { email, phone, password }
const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { createToken, requireAuth } = require('../middleware/auth')

const router = express.Router()

// The three account tables and the role each one gives
const ACCOUNT_TABLES = [
  { table: 'admins', role: 'admin' },
  { table: 'mechanics', role: 'mechanic' },
  { table: 'customers', role: 'customer' },
]

// Look for an email in all three tables
async function findAccount(email) {
  for (const { table, role } of ACCOUNT_TABLES) {
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email])
    if (rows.length) return { ...rows[0], role }
  }
  return null
}

// What we send back about a user (never the password hash!)
const publicUser = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role })

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const account = await findAccount(email)
  // Same message for "no such email" and "wrong password" — don't tell attackers which one it was
  if (!account || !(await bcrypt.compare(password, account.password_hash))) {
    return res.status(401).json({ error: 'Incorrect email or password' })
  }
  if (account.role === 'customer' && account.status === 'inactive') {
    return res.status(403).json({ error: 'This account has been deactivated. Please contact the workshop.' })
  }

  const user = publicUser(account)
  res.json({ token: createToken(user), user })
})

router.post('/signup', async (req, res) => {
  const { name, email, phone, address, password } = req.body || {}
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!name || !cleanEmail || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone and password are required' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address' })
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (await findAccount(cleanEmail)) return res.status(409).json({ error: 'An account with this email already exists' })

  // Next customer ID: C- + (highest number + 1), e.g. C-009
  const [[{ maxNum }]] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS maxNum FROM customers')
  const id = 'C-' + String((maxNum || 0) + 1).padStart(3, '0')

  const password_hash = await bcrypt.hash(String(password), 10)
  await db.query(
    'INSERT INTO customers (id, name, email, password_hash, phone, address, joined) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
    [id, String(name).trim(), cleanEmail, password_hash, String(phone).trim(), address ? String(address).trim() : null]
  )

  const user = { id, name: String(name).trim(), email: cleanEmail, role: 'customer' }
  res.status(201).json({ token: createToken(user), user })
})

router.get('/me', requireAuth, async (req, res) => {
  const table = ACCOUNT_TABLES.find((t) => t.role === req.user.role).table
  const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [req.user.id])
  if (!rows.length) return res.status(404).json({ error: 'Account no longer exists' })
  res.json(publicUser({ ...rows[0], role: req.user.role }))
})

// POST /api/auth/change-password   { current, next }  — any logged-in user
router.post('/change-password', requireAuth, async (req, res) => {
  const { current, next } = req.body || {}
  if (!current || !next) return res.status(400).json({ error: 'current and next passwords are required' })
  if (String(next).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' })
  const table = ACCOUNT_TABLES.find((t) => t.role === req.user.role).table
  const [rows] = await db.query(`SELECT password_hash FROM ${table} WHERE id = ?`, [req.user.id])
  if (!rows.length || !(await bcrypt.compare(String(current), rows[0].password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  await db.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [await bcrypt.hash(String(next), 10), req.user.id])
  res.json({ ok: true })
})

// POST /api/auth/forgot-password   { email, phone, password }
// There is no email server, so the account's phone number is the proof that it is really you.
// Admin passwords can't be reset this way.
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const phone = String(req.body?.phone || '').replace(/\D/g, '')
  const password = String(req.body?.password || '')
  if (!email || !phone || !password) return res.status(400).json({ error: 'Email, phone number and a new password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const account = await findAccount(email)
  const samePhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d && (d === phone || d.endsWith(phone) || phone.endsWith(d)) && phone.length >= 8 }
  // Same message whether the email or the phone was wrong — don't help guessers
  if (!account || account.role === 'admin' || !samePhone(account.phone)) {
    return res.status(400).json({ error: 'That email and phone number do not match an account' })
  }
  const table = ACCOUNT_TABLES.find((t) => t.role === account.role).table
  await db.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [await bcrypt.hash(password, 10), account.id])
  res.json({ ok: true })
})

module.exports = router
