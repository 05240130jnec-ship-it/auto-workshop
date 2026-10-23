// Shop: part orders customers place ("Buy Now") and parts customers want to sell
//   /api/shop/reservations   customer: order + see own   admin: see all, mark collected
//   /api/shop/listings       customer: submit + see own  admin: see all, approve/reject
const express = require('express')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')
const { nextId } = require('../utils')
const { findItem } = require('../database/catalog')

const router = express.Router()
router.use(requireAuth)

// ---------- Part orders ----------

router.get('/reservations', requireRole('admin', 'customer'), async (req, res) => {
  const mine = req.user.role === 'customer'
  const [rows] = await db.query(
    `SELECT x.*, c.name AS customer_name, c.phone AS customer_phone, x.qty * x.price AS total
       FROM reservations x JOIN customers c ON c.id = x.customer_id
      ${mine ? 'WHERE x.customer_id = ?' : ''} ORDER BY x.created_on DESC, x.id DESC`,
    mine ? [req.user.id] : [])
  res.json(rows)
})

// POST /api/shop/reservations   { slug: "engine-oil", qty: 2, pickup: "2026-10-25" }
router.post('/reservations', requireRole('customer'), async (req, res) => {
  const item = findItem(req.body?.slug)
  const qty = Number(req.body?.qty)
  if (!item) return res.status(400).json({ error: 'Unknown product' })
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({ error: 'Quantity must be between 1 and 20' })
  if (!req.body?.pickup) return res.status(400).json({ error: 'Pickup date is required' })

  const id = await nextId('reservations', 'ORD-', 4)
  await db.query(
    `INSERT INTO reservations (id, customer_id, slug, name, price, qty, pickup, created_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [id, req.user.id, item.slug, item.name, item.price, qty, req.body.pickup]) // price comes from the server, not the browser
  res.status(201).json({ id, total: item.price * qty })
})

// PATCH /api/shop/reservations/ORD-0001/collected
router.patch('/reservations/:id/collected', requireRole('admin'), async (req, res) => {
  const [result] = await db.query("UPDATE reservations SET status = 'collected' WHERE id = ? AND status = 'ready'", [req.params.id])
  if (!result.affectedRows) return res.status(400).json({ error: 'Order not found or already collected' })
  res.json({ ok: true })
})

// ---------- Sell-a-part listings ----------

router.get('/listings', requireRole('admin', 'customer'), async (req, res) => {
  const mine = req.user.role === 'customer'
  const [rows] = await db.query(
    `SELECT l.*, c.name AS customer_name FROM listings l JOIN customers c ON c.id = l.customer_id
      ${mine ? 'WHERE l.customer_id = ?' : ''} ORDER BY l.created_on DESC, l.id DESC`,
    mine ? [req.user.id] : [])
  res.json(rows)
})

// POST /api/shop/listings   { name, category, condition, price, qty, description }
router.post('/listings', requireRole('customer'), async (req, res) => {
  const b = req.body || {}
  if (!b.name || !b.category || !b.condition || !b.description || !(Number(b.price) >= 0)) {
    return res.status(400).json({ error: 'name, category, condition, price and description are required' })
  }
  const id = await nextId('listings', 'L-', 3)
  await db.query(
    `INSERT INTO listings (id, customer_id, name, category, item_condition, price, qty, description, created_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [id, req.user.id, b.name, b.category, b.condition, Number(b.price), Math.max(1, Number(b.qty) || 1), b.description])
  res.status(201).json({ id, status: 'review' })
})

// PATCH /api/shop/listings/L-001   { status: "approved" | "rejected" }
router.patch('/listings/:id', requireRole('admin'), async (req, res) => {
  if (!['approved', 'rejected'].includes(req.body?.status)) return res.status(400).json({ error: 'status must be approved or rejected' })
  const [result] = await db.query('UPDATE listings SET status = ? WHERE id = ?', [req.body.status, req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Listing not found' })
  res.json({ ok: true })
})

module.exports = router
