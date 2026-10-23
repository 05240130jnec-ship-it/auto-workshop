// Inventory (spare parts) — admin manages, mechanics can view
const express = require('express')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')
const { nextId, pick, updateRow } = require('../utils')

const router = express.Router()
router.use(requireAuth)

// stock_state: "out" / "low" / "ok" — worked out by MySQL with CASE
const SELECT_PART = `
  SELECT i.*, s.name AS supplier_name,
         CASE WHEN i.stock <= 0 THEN 'out' WHEN i.stock <= i.reorder_level THEN 'low' ELSE 'ok' END AS stock_state,
         (SELECT COALESCE(SUM(o.qty), 0) FROM purchase_orders o
           WHERE o.part_id = i.id AND o.status IN ('pending','approved')) AS on_order
    FROM inventory i
    LEFT JOIN suppliers s ON s.id = i.supplier_id`

// GET /api/inventory   (?category=Cleaning  ?low=1)
router.get('/', requireRole('admin', 'mechanic'), async (req, res) => {
  const where = []
  const params = []
  if (req.query.category) { where.push('i.category = ?'); params.push(req.query.category) }
  if (req.query.low) where.push('i.stock <= i.reorder_level')
  const [rows] = await db.query(`${SELECT_PART} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.id`, params)
  res.json(rows.map((p) => ({ ...p, on_order: Number(p.on_order) })))
})

// GET /api/inventory/P-101
router.get('/:id', requireRole('admin', 'mechanic'), async (req, res) => {
  const [rows] = await db.query(`${SELECT_PART} WHERE i.id = ?`, [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Part not found' })
  res.json({ ...rows[0], on_order: Number(rows[0].on_order) })
})

async function skuTaken(sku, exceptId) {
  const [rows] = await db.query('SELECT id FROM inventory WHERE sku = ? AND id <> ?', [sku, exceptId || ''])
  return rows.length > 0
}

// POST /api/inventory   { name, sku, category, supplier_id, stock, reorder_level, price }
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {}
  if (!b.name || !b.sku || !b.category || b.price === undefined) return res.status(400).json({ error: 'name, sku, category and price are required' })
  const sku = String(b.sku).toUpperCase()
  if (await skuTaken(sku)) return res.status(409).json({ error: 'Another part already uses SKU ' + sku })
  const id = await nextId('inventory', 'P-', 3)
  await db.query(
    'INSERT INTO inventory (id, sku, name, category, stock, reorder_level, price, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, sku, b.name, b.category, Number(b.stock) || 0, Number(b.reorder_level) || 0, Number(b.price) || 0, b.supplier_id || null])
  res.status(201).json({ id })
})

// PATCH /api/inventory/P-101
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const fields = pick(req.body, ['name', 'sku', 'category', 'stock', 'reorder_level', 'price', 'supplier_id'])
  if (fields.sku !== undefined) {
    fields.sku = String(fields.sku).toUpperCase()
    if (await skuTaken(fields.sku, req.params.id)) return res.status(409).json({ error: 'Another part already uses SKU ' + fields.sku })
  }
  for (const k of ['stock', 'reorder_level', 'price']) if (fields[k] !== undefined) fields[k] = Math.max(0, Number(fields[k]) || 0)
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nothing to update' })
  if (!(await updateRow('inventory', req.params.id, fields))) return res.status(404).json({ error: 'Part not found' })
  res.json({ ok: true })
})

// PATCH /api/inventory/P-101/adjust   { change: -1 }  — the + / − buttons
router.patch('/:id/adjust', requireRole('admin'), async (req, res) => {
  const change = Number(req.body?.change)
  if (!Number.isInteger(change) || change === 0) return res.status(400).json({ error: 'change must be a whole number like 1 or -1' })
  // "stock + ? >= 0" stops stock going below zero
  const [result] = await db.query('UPDATE inventory SET stock = stock + ? WHERE id = ? AND stock + ? >= 0', [change, req.params.id, change])
  if (!result.affectedRows) return res.status(400).json({ error: 'Part not found or not enough stock' })
  const [[part]] = await db.query('SELECT stock, reorder_level FROM inventory WHERE id = ?', [req.params.id])
  res.json({ stock: part.stock, low: part.stock <= part.reorder_level })
})

// DELETE /api/inventory/P-101
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Part not found' })
  res.status(204).end()
})

module.exports = router
