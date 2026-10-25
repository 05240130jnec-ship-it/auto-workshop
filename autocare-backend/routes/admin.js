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
module.exports = router;