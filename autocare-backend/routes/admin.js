const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));   // only admins

// ---------- DASHBOARD ----------

// GET /api/admin/dashboard  -> numbers for the admin home page
router.get('/dashboard', async (req, res) => {
  const [byStatus] = await db.query('SELECT status, COUNT(*) AS total FROM repairs GROUP BY status');
  const [[customers]] = await db.query("SELECT COUNT(*) AS total FROM customers WHERE status = 'active'");
  const [[mechanics]] = await db.query("SELECT COUNT(*) AS total FROM mechanics WHERE status <> 'leave'");
  const [[lowStock]]  = await db.query('SELECT COUNT(*) AS total FROM inventory WHERE stock <= reorder');
  const [[revenue]]   = await db.query("SELECT COALESCE(SUM(cost), 0) AS total FROM repairs WHERE status = 'complete'");
  const [[listings]]  = await db.query("SELECT COUNT(*) AS total FROM listings WHERE status = 'review'");
  const [[orders]]    = await db.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'");

  // turn [{status:'pending', total:5}, ...] into { pending:5, ... }
  const repairs = { pending: 0, progress: 0, complete: 0, cancelled: 0 };
  byStatus.forEach(row => { repairs[row.status] = row.total; });

  res.json({
    repairs,
    activeCustomers: customers.total,
    availableMechanics: mechanics.total,
    lowStockParts: lowStock.total,
    revenue: Number(revenue.total),
    listingsToReview: listings.total,
    pendingOrders: orders.total
  });
});

// ---------- REPAIRS ----------

const SELECT_REPAIR = `
  SELECT r.*, c.name AS customerName, c.phone AS customerPhone, m.name AS mechanicName
  FROM repairs r
  JOIN customers c ON c.id = r.customerId
  LEFT JOIN mechanics m ON m.id = r.mechanicId`;

// GET /api/admin/repairs            -> all repairs
// GET /api/admin/repairs?status=pending  -> only pending
router.get('/repairs', async (req, res) => {
  const { status } = req.query;
  if (status) {
    const [rows] = await db.query(SELECT_REPAIR + ' WHERE r.status = ? ORDER BY r.date DESC', [status]);
    return res.json(rows);
  }
  const [rows] = await db.query(SELECT_REPAIR + ' ORDER BY r.date DESC');
  res.json(rows);
});

// GET /api/admin/repairs/ACP-9247  -> one repair with its parts and services
router.get('/repairs/:id', async (req, res) => {
  const [rows] = await db.query(SELECT_REPAIR + ' WHERE r.id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Repair not found.' });

  const [parts] = await db.query('SELECT * FROM repair_parts WHERE repairId = ?', [req.params.id]);
  const [services] = await db.query('SELECT * FROM repair_services WHERE repairId = ?', [req.params.id]);
  res.json({ ...rows[0], parts, services });
});

// PATCH /api/admin/repairs/ACP-9250  -> assign mechanic, change status, priority, due date, cost
router.patch('/repairs/:id', async (req, res) => {
  const body = req.body || {};
  const STATUSES = ['pending', 'progress', 'complete', 'cancelled'];
  const PRIORITIES = ['normal', 'high', 'urgent'];

  if (body.status && !STATUSES.includes(body.status)) {
    return res.status(400).json({ error: 'Status must be pending, progress, complete or cancelled.' });
  }
  if (body.priority && !PRIORITIES.includes(body.priority)) {
    return res.status(400).json({ error: 'Priority must be normal, high or urgent.' });
  }
  if (body.mechanicId) {
    const [mech] = await db.query('SELECT id FROM mechanics WHERE id = ?', [body.mechanicId]);
    if (mech.length === 0) return res.status(400).json({ error: 'Mechanic not found.' });
  }

  // Only these fields can be changed
  const allowed = ['mechanicId', 'status', 'priority', 'due', 'cost', 'notes'];
  const fields = allowed.filter(f => body[f] !== undefined);
  if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update.' });

  const sql = 'UPDATE repairs SET ' + fields.map(f => f + ' = ?').join(', ') + ' WHERE id = ?';
  const values = fields.map(f => body[f]);
  const [result] = await db.query(sql, [...values, req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair not found.' });

  const [rows] = await db.query(SELECT_REPAIR + ' WHERE r.id = ?', [req.params.id]);
  res.json(rows[0]);
});
// ---------- HELPERS ----------

// Is this email already used by any account?
async function emailTaken(email) {
  for (const table of ['admins', 'mechanics', 'customers']) {
    const [rows] = await db.query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
    if (rows.length > 0) return true;
  }
  return false;
}

// Updates only the allowed fields that were sent. Returns false if the id was not found.
async function updateRow(table, id, body, allowed) {
  const fields = allowed.filter(f => body[f] !== undefined);
  if (fields.length === 0) return null;
  const sql = `UPDATE ${table} SET ` + fields.map(f => f + ' = ?').join(', ') + ' WHERE id = ?';
  const [result] = await db.query(sql, [...fields.map(f => body[f]), id]);
  return result.affectedRows > 0;
}

// ---------- MECHANICS ----------

const MECHANIC_FIELDS = 'id, name, email, phone, specialization, experience, status, photo, joined';

// GET /api/admin/mechanics  -> all mechanics + how many open jobs each has
router.get('/mechanics', async (req, res) => {
  const [rows] = await db.query(`
    SELECT ${MECHANIC_FIELDS},
      (SELECT COUNT(*) FROM repairs r
       WHERE r.mechanicId = mechanics.id AND r.status IN ('pending', 'progress')) AS openJobs
    FROM mechanics ORDER BY id`);
  res.json(rows);
});

// POST /api/admin/mechanics  -> add a mechanic
router.post('/mechanics', async (req, res) => {
  const { name, email, phone, password, specialization, experience } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (await emailTaken(email)) {
    return res.status(409).json({ error: 'This email is already used.' });
  }

  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM mechanics');
  const id = 'M-' + String((last[0].last || 0) + 1).padStart(3, '0');   // M-006
  const hash = await bcrypt.hash(password, 10);

  await db.query(
    `INSERT INTO mechanics (id, name, email, phone, password, specialization, experience, status, joined)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
    [id, name, email, phone || '', hash, specialization || 'General', Number(experience) || 0]
  );
  res.status(201).json({ id });
});

// PATCH /api/admin/mechanics/M-002  -> edit details or status
router.patch('/mechanics/:id', async (req, res) => {
  const body = req.body || {};
  if (body.status && !['active', 'busy', 'leave'].includes(body.status)) {
    return res.status(400).json({ error: 'Status must be active, busy or leave.' });
  }
  const ok = await updateRow('mechanics', req.params.id, body,
    ['name', 'phone', 'specialization', 'experience', 'status']);
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Mechanic not found.' });

  const [rows] = await db.query(`SELECT ${MECHANIC_FIELDS} FROM mechanics WHERE id = ?`, [req.params.id]);
  res.json(rows[0]);
});

// DELETE /api/admin/mechanics/M-006  -> remove (their repairs become unassigned)
router.delete('/mechanics/:id', async (req, res) => {
  const [result] = await db.query('DELETE FROM mechanics WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Mechanic not found.' });
  res.json({ deleted: req.params.id });
});

// ---------- CUSTOMERS ----------

const CUSTOMER_FIELDS = 'id, name, email, phone, address, status, joined';

// GET /api/admin/customers  -> all customers + how many repairs each has
router.get('/customers', async (req, res) => {
  const [rows] = await db.query(`
    SELECT ${CUSTOMER_FIELDS},
      (SELECT COUNT(*) FROM repairs r WHERE r.customerId = customers.id) AS repairCount
    FROM customers ORDER BY id`);
  res.json(rows);
});

// PATCH /api/admin/customers/C-007  -> edit details, or block/unblock with status
router.patch('/customers/:id', async (req, res) => {
  const body = req.body || {};
  if (body.status && !['active', 'inactive'].includes(body.status)) {
    return res.status(400).json({ error: 'Status must be active or inactive.' });
  }
  const ok = await updateRow('customers', req.params.id, body, ['name', 'phone', 'address', 'status']);
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Customer not found.' });

  const [rows] = await db.query(`SELECT ${CUSTOMER_FIELDS} FROM customers WHERE id = ?`, [req.params.id]);
  res.json(rows[0]);
});
// ---------- INVENTORY ----------

// GET /api/admin/inventory          -> all parts
// GET /api/admin/inventory?low=1    -> only parts at or below reorder level
router.get('/inventory', async (req, res) => {
  let sql = `
    SELECT i.*, s.name AS supplierName, (i.stock <= i.reorder) AS lowStock
    FROM inventory i
    LEFT JOIN suppliers s ON s.id = i.supplierId`;
  if (req.query.low) sql += ' WHERE i.stock <= i.reorder';
  const [rows] = await db.query(sql + ' ORDER BY i.id');
  res.json(rows);
});

// POST /api/admin/inventory  -> add a part
router.post('/inventory', async (req, res) => {
  const { sku, name, category, stock, reorder, price, supplierId } = req.body || {};
  if (!sku || !name || price === undefined) {
    return res.status(400).json({ error: 'SKU, name and price are required.' });
  }

  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM inventory');
  const id = 'P-' + ((last[0].last || 100) + 1);   // P-115

  try {
    await db.query(
      `INSERT INTO inventory (id, sku, name, category, stock, reorder, price, supplierId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sku, name, category || 'Other', Number(stock) || 0, Number(reorder) || 5, price, supplierId || null]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This SKU already exists.' });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Supplier not found.' });
    throw err;
  }
  res.status(201).json({ id });
});

// PATCH /api/admin/inventory/P-101  -> edit price, stock, reorder level...
router.patch('/inventory/:id', async (req, res) => {
  const ok = await updateRow('inventory', req.params.id, req.body || {},
    ['name', 'category', 'stock', 'reorder', 'price', 'supplierId']);
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Part not found.' });

  const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// DELETE /api/admin/inventory/P-115
router.delete('/inventory/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Part not found.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'This part is used in orders, so it cannot be deleted.' });
    }
    throw err;
  }
  res.json({ deleted: req.params.id });
});

// ---------- SUPPLIERS ----------

// GET /api/admin/suppliers  -> all suppliers + how many parts each supplies
router.get('/suppliers', async (req, res) => {
  const [rows] = await db.query(`
    SELECT s.*, (SELECT COUNT(*) FROM inventory i WHERE i.supplierId = s.id) AS partCount
    FROM suppliers s ORDER BY s.id`);
  res.json(rows);
});

// POST /api/admin/suppliers  -> add a supplier
router.post('/suppliers', async (req, res) => {
  const { name, person, phone, email, address } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });

  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM suppliers');
  const id = 'S-' + String((last[0].last || 0) + 1).padStart(2, '0');   // S-06

  await db.query(
    'INSERT INTO suppliers (id, name, person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, person || '', phone, email || '', address || '']
  );
  res.status(201).json({ id });
});

// PATCH /api/admin/suppliers/S-06
router.patch('/suppliers/:id', async (req, res) => {
  const ok = await updateRow('suppliers', req.params.id, req.body || {},
    ['name', 'person', 'phone', 'email', 'address']);
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Supplier not found.' });

  const [rows] = await db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// DELETE /api/admin/suppliers/S-06
router.delete('/suppliers/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'This supplier has orders, so it cannot be deleted.' });
    }
    throw err;
  }
  res.json({ deleted: req.params.id });
});

// ---------- PURCHASE ORDERS ----------

const SELECT_ORDER = `
  SELECT o.*, i.name AS partName, i.stock AS currentStock, s.name AS supplierName
  FROM orders o
  LEFT JOIN inventory i ON i.id = o.partId
  LEFT JOIN suppliers s ON s.id = o.supplierId`;

// GET /api/admin/orders   (?status=pending works too)
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  if (status) {
    const [rows] = await db.query(SELECT_ORDER + ' WHERE o.status = ? ORDER BY o.date DESC', [status]);
    return res.json(rows);
  }
  const [rows] = await db.query(SELECT_ORDER + ' ORDER BY o.date DESC');
  res.json(rows);
});

// POST /api/admin/orders  -> order more of a part from its supplier
router.post('/orders', async (req, res) => {
  const { partId, qty, supplierId, note } = req.body || {};
  if (!partId || !qty) return res.status(400).json({ error: 'Part and quantity are required.' });

  const [parts] = await db.query('SELECT * FROM inventory WHERE id = ?', [partId]);
  if (parts.length === 0) return res.status(404).json({ error: 'Part not found.' });

  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) AS last FROM orders');
  const id = 'PO-' + ((last[0].last || 2210) + 1);   // PO-2217

  await db.query(
    `INSERT INTO orders (id, partId, qty, supplierId, requestedBy, status, date, note)
     VALUES (?, ?, ?, ?, ?, 'pending', CURDATE(), ?)`,
    [id, partId, Number(qty), supplierId || parts[0].supplierId, req.user.id, note || '']
  );
  res.status(201).json({ id });
});

// PATCH /api/admin/orders/PO-2217  -> approve, reject, or mark received
// pending -> approved or rejected,  approved -> received (stock goes up)
router.patch('/orders/:id', async (req, res) => {
  const { status } = req.body || {};
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
  const order = rows[0];

  const allowedNext = {
    pending: ['approved', 'rejected'],
    approved: ['received'],
    received: [],
    rejected: []
  };
  if (!allowedNext[order.status].includes(status)) {
    return res.status(400).json({ error: `A ${order.status} order cannot be changed to ${status}.` });
  }

  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
  if (status === 'received') {
    await db.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [order.qty, order.partId]);
  }

  const [updated] = await db.query(SELECT_ORDER + ' WHERE o.id = ?', [order.id]);
  res.json(updated[0]);
});
// ---------- SHOP: LISTINGS (customers selling parts) ----------

// GET /api/admin/shop/listings              -> all listings
// GET /api/admin/shop/listings?status=review -> only ones waiting for a decision
router.get('/shop/listings', async (req, res) => {
  let sql = `
    SELECT l.*, c.name AS customerName, c.phone AS customerPhone
    FROM listings l
    JOIN customers c ON c.id = l.customerId`;
  const params = [];
  if (req.query.status) {
    sql += ' WHERE l.status = ?';
    params.push(req.query.status);
  }
  const [rows] = await db.query(sql + ' ORDER BY l.date DESC', params);
  res.json(rows);
});

// PATCH /api/admin/shop/listings/L-101  -> approve or reject (only while in review)
router.patch('/shop/listings/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }
  const [rows] = await db.query('SELECT status FROM listings WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
  if (rows[0].status !== 'review') {
    return res.status(400).json({ error: `This listing is already ${rows[0].status}.` });
  }

  await db.query('UPDATE listings SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ id: req.params.id, status });
});

// ---------- SHOP: RESERVATIONS (customers reserving workshop parts) ----------

// GET /api/admin/shop/reservations              -> all reservations
// GET /api/admin/shop/reservations?status=ready -> waiting for pickup
router.get('/shop/reservations', async (req, res) => {
  let sql = `
    SELECT r.*, c.name AS customerName, c.phone AS customerPhone
    FROM reservations r
    JOIN customers c ON c.id = r.customerId`;
  const params = [];
  if (req.query.status) {
    sql += ' WHERE r.status = ?';
    params.push(req.query.status);
  }
  const [rows] = await db.query(sql + ' ORDER BY r.pickup', params);
  res.json(rows);
});

// PATCH /api/admin/shop/reservations/R-1002  -> collected, or cancelled (stock goes back)
router.patch('/shop/reservations/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!['collected', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be collected or cancelled.' });
  }
  const [rows] = await db.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Reservation not found.' });
  const reservation = rows[0];
  if (reservation.status !== 'ready') {
    return res.status(400).json({ error: `This reservation is already ${reservation.status}.` });
  }

  await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, reservation.id]);
  if (status === 'cancelled') {
    await db.query('UPDATE inventory SET stock = stock + ? WHERE sku = ?', [reservation.qty, reservation.slug]);
  }
  res.json({ id: reservation.id, status });
});
module.exports = router;