// Suppliers — admin manages them, mechanics can view them
const express = require('express')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')
const { nextId, pick, updateRow } = require('../utils')

const router = express.Router()
router.use(requireAuth)

// GET /api/suppliers  — with how many parts they supply and their order totals
router.get('/', requireRole('admin', 'mechanic'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT s.*,
           (SELECT COUNT(*) FROM inventory i WHERE i.supplier_id = s.id) AS parts,
           (SELECT COUNT(*) FROM purchase_orders o WHERE o.supplier_id = s.id) AS orders,
           (SELECT COALESCE(SUM(o.qty * i.price), 0) FROM purchase_orders o JOIN inventory i ON i.id = o.part_id
             WHERE o.supplier_id = s.id AND o.status = 'received') AS received_value
      FROM suppliers s ORDER BY s.id`)
  res.json(rows.map((s) => ({ ...s, received_value: Number(s.received_value) })))
})

// GET /api/suppliers/S-01  — details + their parts + their orders
router.get('/:id', requireRole('admin', 'mechanic'), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Supplier not found' })
  const [parts] = await db.query('SELECT * FROM inventory WHERE supplier_id = ? ORDER BY name', [req.params.id])
  const [orders] = await db.query(
    `SELECT o.*, i.name AS part_name, o.qty * i.price AS cost FROM purchase_orders o
       LEFT JOIN inventory i ON i.id = o.part_id WHERE o.supplier_id = ? ORDER BY o.order_date DESC`, [req.params.id])
  res.json({ ...rows[0], parts, orders })
})

// POST /api/suppliers
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {}
  if (!b.name || !b.person || !b.phone || !b.address) return res.status(400).json({ error: 'name, person, phone and address are required' })
  const id = await nextId('suppliers', 'S-', 2)
  await db.query('INSERT INTO suppliers (id, name, person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
    [id, b.name, b.person, b.phone, b.email || null, b.address])
  res.status(201).json({ id })
})

// PATCH /api/suppliers/S-01
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const fields = pick(req.body, ['name', 'person', 'phone', 'email', 'address'])
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nothing to update' })
  if (!(await updateRow('suppliers', req.params.id, fields))) return res.status(404).json({ error: 'Supplier not found' })
  res.json({ ok: true })
})

// DELETE /api/suppliers/S-01  — not allowed while parts are linked to them
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM inventory WHERE supplier_id = ?', [req.params.id])
  if (n > 0) return res.status(400).json({ error: `This supplier still supplies ${n} product(s). Move them to another supplier first.` })
  const [result] = await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Supplier not found' })
  res.status(204).end()
})

module.exports = router
