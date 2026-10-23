// Customers
//   admin    → list, view, add, edit, deactivate/delete
//   customer → view and edit their OWN details
const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')
const { nextId, emailTaken, pick, updateRow, isEmail } = require('../utils')

const router = express.Router()
router.use(requireAuth)

// Never send password_hash to the frontend
const COLUMNS = 'c.id, c.name, c.email, c.phone, c.address, c.status, c.joined'

const isSelfOrAdmin = (req) => req.user.role === 'admin' || (req.user.role === 'customer' && req.user.id === req.params.id)

// GET /api/customers  — with repair counts and total spent
router.get('/', requireRole('admin'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT ${COLUMNS},
           COUNT(r.id) AS repairs,
           SUM(r.status IN ('pending','progress')) AS open_jobs,
           COALESCE(SUM(CASE WHEN r.status = 'complete' THEN r.cost END), 0) AS total_spent
      FROM customers c
      LEFT JOIN repairs r ON r.customer_id = c.id
     GROUP BY c.id
     ORDER BY c.id`)
  res.json(rows.map((r) => ({ ...r, open_jobs: Number(r.open_jobs || 0), total_spent: Number(r.total_spent) })))
})

// GET /api/customers/C-001  — details + their repairs
router.get('/:id', async (req, res) => {
  if (!isSelfOrAdmin(req)) return res.status(403).json({ error: 'You can only view your own account' })
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM customers c WHERE c.id = ?`, [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Customer not found' })
  const [repairs] = await db.query(
    `SELECT r.*, m.name AS mechanic_name FROM repairs r LEFT JOIN mechanics m ON m.id = r.mechanic_id
      WHERE r.customer_id = ? ORDER BY r.booked_on DESC`, [req.params.id])
  res.json({ ...rows[0], repairs })
})

// POST /api/customers  — admin adds a customer (with a temporary password)
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, phone, address, status, password } = req.body || {}
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!name || !phone || !isEmail(cleanEmail)) return res.status(400).json({ error: 'Name, phone and a valid email are required' })
  if (await emailTaken(cleanEmail)) return res.status(409).json({ error: 'That email is already used by another account' })

  const id = await nextId('customers', 'C-', 3)
  await db.query(
    'INSERT INTO customers (id, name, email, password_hash, phone, address, status, joined) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())',
    [id, name.trim(), cleanEmail, await bcrypt.hash(String(password || 'welcome123'), 10), phone.trim(), address || null, status === 'inactive' ? 'inactive' : 'active']
  )
  res.status(201).json({ id })
})

// PATCH /api/customers/C-001
//   admin may change: name, email, phone, address, status
//   customer (self) may change: name, phone, address
router.patch('/:id', async (req, res) => {
  if (!isSelfOrAdmin(req)) return res.status(403).json({ error: 'You can only edit your own account' })
  const allowed = req.user.role === 'admin' ? ['name', 'email', 'phone', 'address', 'status'] : ['name', 'phone', 'address']
  const fields = pick(req.body, allowed)

  if (fields.email !== undefined) {
    fields.email = String(fields.email).trim().toLowerCase()
    if (!isEmail(fields.email)) return res.status(400).json({ error: 'Invalid email' })
    if (await emailTaken(fields.email, { table: 'customers', id: req.params.id })) {
      return res.status(409).json({ error: 'That email is already used by another account' })
    }
  }
  if (fields.status !== undefined && !['active', 'inactive'].includes(fields.status)) {
    return res.status(400).json({ error: 'status must be active or inactive' })
  }
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nothing to update' })

  const changed = await updateRow('customers', req.params.id, fields)
  if (!changed) return res.status(404).json({ error: 'Customer not found' })
  res.json({ ok: true })
})

// DELETE /api/customers/C-001
//   open jobs → refused; past jobs → marked inactive (keeps service history); none → deleted
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[counts]] = await db.query(
    `SELECT COUNT(*) AS total, SUM(status IN ('pending','progress')) AS open_jobs FROM repairs WHERE customer_id = ?`,
    [req.params.id])
  if (Number(counts.open_jobs) > 0) {
    return res.status(400).json({ error: `This customer has ${counts.open_jobs} open job(s). Finish or cancel them first.` })
  }
  if (counts.total > 0) {
    await updateRow('customers', req.params.id, { status: 'inactive' })
    return res.json({ deactivated: true, message: 'Customer has past repairs, so they were marked inactive instead of deleted' })
  }
  const [result] = await db.query('DELETE FROM customers WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Customer not found' })
  res.status(204).end()
})

module.exports = router
