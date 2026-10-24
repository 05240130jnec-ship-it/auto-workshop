// Purchase orders (restocking parts)
//   mechanic → request parts (pending), see their own requests
//   admin    → see all, create (approved straight away), approve, reject, mark received (adds stock)
const express = require('express')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')
const { nextId } = require('../utils')

const router = express.Router()
router.use(requireAuth)

const SELECT_ORDER = `
  SELECT o.*, i.name AS part_name, i.sku, i.stock, i.price, o.qty * i.price AS cost,
         s.name AS supplier_name, COALESCE(m.name, 'Admin') AS requested_by_name
    FROM purchase_orders o
    LEFT JOIN inventory i ON i.id = o.part_id
    LEFT JOIN suppliers s ON s.id = o.supplier_id
    LEFT JOIN mechanics m ON m.id = o.requested_by`

// GET /api/orders   (?status=pending)
router.get('/', requireRole('admin', 'mechanic'), async (req, res) => {
  const where = []
  const params = []
  if (req.user.role === 'mechanic') { where.push('o.requested_by = ?'); params.push(req.user.id) }
  if (req.query.status) { where.push('o.status = ?'); params.push(req.query.status) }
  const [rows] = await db.query(`${SELECT_ORDER} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.order_date DESC, o.id DESC`, params)
  res.json(rows.map((o) => ({ ...o, cost: Number(o.cost || 0) })))
})

// POST /api/orders   { part_id, qty, note? }
//   admin may also pass requested_by (a mechanic id) to log a mechanic's request; it then waits for approval
router.post('/', requireRole('admin', 'mechanic'), async (req, res) => {
  const { part_id, note } = req.body || {}
  const qty = Number(req.body?.qty)
  if (!part_id || !Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'part_id and a quantity of 1 or more are required' })
  const [parts] = await db.query('SELECT supplier_id FROM inventory WHERE id = ?', [part_id])
  if (!parts.length) return res.status(400).json({ error: 'Unknown part' })

  const id = await nextId('purchase_orders', 'PO-', 4)
  const isAdmin = req.user.role === 'admin'
  const by = isAdmin ? (req.body.requested_by || 'admin') : req.user.id
  const status = by === 'admin' ? 'approved' : 'pending'
  await db.query(
    `INSERT INTO purchase_orders (id, part_id, supplier_id, requested_by, qty, status, order_date, note)
     VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
    [id, part_id, parts[0].supplier_id, by, qty, status, note || null])
  res.status(201).json({ id, status })
})

// Load an order and check it is in the expected status
async function loadOrder(id, expected) {
  const [rows] = await db.query('SELECT * FROM purchase_orders WHERE id = ?', [id])
  if (!rows.length) return { error: [404, 'Order not found'] }
  if (rows[0].status !== expected) return { error: [400, `Only ${expected} orders can do this (this one is ${rows[0].status})`] }
  return { order: rows[0] }
}

// PATCH /api/orders/PO-2214/approve
router.patch('/:id/approve', requireRole('admin'), async (req, res) => {
  const { error } = await loadOrder(req.params.id, 'pending')
  if (error) return res.status(error[0]).json({ error: error[1] })
  await db.query("UPDATE purchase_orders SET status = 'approved' WHERE id = ?", [req.params.id])
  res.json({ ok: true })
})

// PATCH /api/orders/PO-2214/reject   { note: "reason" }
router.patch('/:id/reject', requireRole('admin'), async (req, res) => {
  if (!req.body?.note) return res.status(400).json({ error: 'Please give a reason (note)' })
  const { error } = await loadOrder(req.params.id, 'pending')
  if (error) return res.status(error[0]).json({ error: error[1] })
  await db.query("UPDATE purchase_orders SET status = 'rejected', note = ? WHERE id = ?", [req.body.note, req.params.id])
  res.json({ ok: true })
})

// PATCH /api/orders/PO-2213/receive  — delivery arrived: add the quantity to stock
// Uses a transaction so stock and order status always change together.
router.patch('/:id/receive', requireRole('admin'), async (req, res) => {
  const { order, error } = await loadOrder(req.params.id, 'approved')
  if (error) return res.status(error[0]).json({ error: error[1] })
  await db.transaction(async (conn) => {
    if (order.part_id) await conn.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [order.qty, order.part_id])
    await conn.query("UPDATE purchase_orders SET status = 'received', order_date = CURDATE() WHERE id = ?", [order.id])
  })
  const [[part]] = await db.query('SELECT stock FROM inventory WHERE id = ?', [order.part_id])
  res.json({ ok: true, new_stock: part ? part.stock : null })
})

module.exports = router
