const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only logged-in customers

// Makes the next id, e.g. R-1001, R-1002 ...
async function nextId(table, prefix, start) {
  const [rows] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(id, ${prefix.length + 1}) AS UNSIGNED)) AS last FROM ${table}`
  );
  return prefix + ((rows[0].last || start) + 1);
}

// ---------- PARTS (the shop catalogue) ----------

// GET /api/shop/parts  -> parts that are in stock
router.get('/parts', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, sku, name, category, price, stock FROM inventory WHERE stock > 0 ORDER BY name'
  );
  res.json(rows);
});

// ---------- RESERVATIONS ----------

// GET /api/shop/reservations  -> my reservations
router.get('/reservations', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM reservations WHERE customerId = ? ORDER BY date DESC', [req.user.id]
  );
  res.json(rows);
});

// POST /api/shop/reservations  -> reserve a part
router.post('/reservations', async (req, res) => {
  const { partId, qty, pickup } = req.body || {};
  const amount = Number(qty) || 1;

  if (!partId || !pickup) {
    return res.status(400).json({ error: 'Please choose a part and a pickup date.' });
  }

  // Price and name come from the database, not from the customer
  const [parts] = await db.query('SELECT * FROM inventory WHERE id = ? OR sku = ?', [partId, partId]);
  if (parts.length === 0) return res.status(404).json({ error: 'Part not found.' });
  const part = parts[0];

  // Take the stock only if there is enough
  const [result] = await db.query(
        'UPDATE inventory SET stock = stock - ? WHERE id = ? AND stock >= ?', [amount, part.id, amount]
  );
  if (result.affectedRows === 0) {
    return res.status(409).json({ error: `Only ${part.stock} left in stock.` });
  }

  const id = await nextId('reservations', 'R-', 1000);
  await db.query(
    `INSERT INTO reservations (id, customerId, slug, name, price, qty, pickup, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', CURDATE())`,
    [id, req.user.id, part.sku, part.name, part.price, amount, pickup]
  );
  res.status(201).json({ id });
});

// PATCH /api/shop/reservations/R-1001  -> cancel, and put the stock back
router.patch('/reservations/:id', async (req, res) => {
  const { status } = req.body || {};
  if (status !== 'cancelled') {
    return res.status(400).json({ error: 'You can only cancel a reservation.' });
  }
  const [rows] = await db.query(
    'SELECT * FROM reservations WHERE id = ? AND customerId = ?', [req.params.id, req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Reservation not found.' });
  if (rows[0].status !== 'ready') {
    return res.status(400).json({ error: 'Only ready reservations can be cancelled.' });
  }

  await db.query("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  await db.query('UPDATE inventory SET stock = stock + ? WHERE sku = ?', [rows[0].qty, rows[0].slug]);
  res.json({ id: req.params.id, status: 'cancelled' });
});

// ---------- LISTINGS (customer sells a part) ----------

// GET /api/shop/listings  -> my listings
router.get('/listings', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM listings WHERE customerId = ? ORDER BY date DESC', [req.user.id]
  );
  res.json(rows);
});

// POST /api/shop/listings  -> list a part for sale (admin approves it later)
router.post('/listings', async (req, res) => {
  const { name, category, condition, price, qty, description } = req.body || {};

  if (!name || !price) {
    return res.status(400).json({ error: 'Please enter a name and a price.' });
  }

  const id = await nextId('listings', 'L-', 100);
  await db.query(
    `INSERT INTO listings (id, customerId, name, category, item_condition, price, qty, description, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'review', CURDATE())`,
    [id, req.user.id, name, category || 'Other', condition || 'used', price, Number(qty) || 1, description || '']
  );
  res.status(201).json({ id, status: 'review' });
});

module.exports = router;