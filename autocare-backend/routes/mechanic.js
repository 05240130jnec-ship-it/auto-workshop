const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('mechanic'));   // only mechanics

const SELECT_REPAIR = `
  SELECT r.*, c.name AS customerName, c.phone AS customerPhone
  FROM repairs r
  JOIN customers c ON c.id = r.customerId`;

// Finds a repair only if it is assigned to THIS mechanic
async function findMyRepair(repairId, mechanicId) {
  const [rows] = await db.query(SELECT_REPAIR + ' WHERE r.id = ? AND r.mechanicId = ?', [repairId, mechanicId]);
  return rows[0];
}

// Adds up parts + services for a repair
async function totalCost(repairId) {
  const [[p]] = await db.query('SELECT COALESCE(SUM(qty * price), 0) AS total FROM repair_parts WHERE repairId = ?', [repairId]);
  const [[s]] = await db.query('SELECT COALESCE(SUM(qty * cost), 0) AS total FROM repair_services WHERE repairId = ?', [repairId]);
  return Number(p.total) + Number(s.total);
}

// ---------- MY JOBS ----------

// GET /api/mechanic/repairs                 -> all jobs assigned to me
// GET /api/mechanic/repairs?status=progress -> only in-progress ones
router.get('/repairs', async (req, res) => {
  let sql = SELECT_REPAIR + ' WHERE r.mechanicId = ?';
  const params = [req.user.id];
  if (req.query.status) {
    sql += ' AND r.status = ?';
    params.push(req.query.status);
  }
  const [rows] = await db.query(sql + ' ORDER BY r.due IS NULL, r.due, r.date', params);
  if (rows.length === 0) return res.json([]);

  // Attach each job's parts and services (2 queries for all jobs, not 2 per job)
  const ids = rows.map(r => r.id);
  const [parts] = await db.query('SELECT * FROM repair_parts WHERE repairId IN (?)', [ids]);
  const [services] = await db.query('SELECT * FROM repair_services WHERE repairId IN (?)', [ids]);
  res.json(rows.map(r => ({
    ...r,
    parts: parts.filter(p => p.repairId === r.id),
    services: services.filter(s => s.repairId === r.id)
  })));
});

// GET /api/mechanic/repairs/ACP-9247  -> one job with parts, services and total
router.get('/repairs/:id', async (req, res) => {
  const repair = await findMyRepair(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Job not found or not assigned to you.' });

  const [parts] = await db.query('SELECT * FROM repair_parts WHERE repairId = ?', [repair.id]);
  const [services] = await db.query('SELECT * FROM repair_services WHERE repairId = ?', [repair.id]);
  res.json({ ...repair, parts, services, total: await totalCost(repair.id) });
});

// PATCH /api/mechanic/repairs/ACP-9247  -> start, pause or finish a job, or add a work note
// pending -> progress -> complete   (progress -> pending is allowed too, e.g. waiting for a part)
router.patch('/repairs/:id', async (req, res) => {
  const { status, notes, addNote } = req.body || {};
  const repair = await findMyRepair(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Job not found or not assigned to you.' });

  if (status) {
    const allowedNext = { pending: ['progress'], progress: ['complete', 'pending'], complete: [], cancelled: [] };
    if (!allowedNext[repair.status].includes(status)) {
      return res.status(400).json({ error: `A ${repair.status} job cannot be changed to ${status}.` });
    }
    await db.query('UPDATE repairs SET status = ? WHERE id = ?', [status, repair.id]);

    // When the job is finished, the bill = parts + services
    if (status === 'complete') {
      const total = await totalCost(repair.id);
      if (total > 0) await db.query('UPDATE repairs SET cost = ? WHERE id = ?', [total, repair.id]);
    }
  }
  if (notes !== undefined) {
    await db.query('UPDATE repairs SET notes = ? WHERE id = ?', [notes, repair.id]);
  }
  // Work notes are kept as lines of text: "[2026-10-28] Ugyen Dorji: Replaced the brake pads"
  if (addNote && addNote.trim()) {
    const line = `[${new Date().toISOString().slice(0, 10)}] ${req.user.name}: ${addNote.trim()}`;
    await db.query('UPDATE repairs SET workNotes = CONCAT_WS(?, workNotes, ?) WHERE id = ?', ['\n', line, repair.id]);
  }

  res.json(await findMyRepair(repair.id, req.user.id));
});

// ---------- PARTS USED ----------

// GET /api/mechanic/parts  -> parts to choose from
router.get('/parts', async (req, res) => {
  const [rows] = await db.query('SELECT id, sku, name, category, stock, reorder, price FROM inventory ORDER BY name');
  res.json(rows);
});

// POST /api/mechanic/repairs/ACP-9247/parts  -> log a part used (stock goes down)
router.post('/repairs/:id/parts', async (req, res) => {
  const { partId, qty } = req.body || {};
  const amount = Number(qty) || 1;

  const repair = await findMyRepair(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Job not found or not assigned to you.' });
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'Start the job before adding parts.' });
  }

  const [parts] = await db.query('SELECT * FROM inventory WHERE id = ?', [partId]);
  if (parts.length === 0) return res.status(404).json({ error: 'Part not found.' });
  const part = parts[0];

  const [result] = await db.query(
    'UPDATE inventory SET stock = stock - ? WHERE id = ? AND stock >= ?', [amount, partId, amount]
  );
  if (result.affectedRows === 0) {
    return res.status(409).json({ error: `Only ${part.stock} ${part.name} left in stock.` });
  }

  const [insert] = await db.query(
    'INSERT INTO repair_parts (repairId, partId, name, qty, price, date) VALUES (?, ?, ?, ?, ?, CURDATE())',
    [repair.id, part.id, part.name, amount, part.price]
  );
  res.status(201).json({ id: insert.insertId, name: part.name, qty: amount, price: part.price });
});

// DELETE /api/mechanic/repairs/ACP-9247/parts/3  -> remove a wrong entry (stock goes back)
router.delete('/repairs/:id/parts/:rowId', async (req, res) => {
  const repair = await findMyRepair(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Job not found or not assigned to you.' });
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'You can only change parts while the job is in progress.' });
  }

  const [rows] = await db.query('SELECT * FROM repair_parts WHERE id = ? AND repairId = ?', [req.params.rowId, repair.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Part entry not found.' });

  await db.query('DELETE FROM repair_parts WHERE id = ?', [rows[0].id]);
  if (rows[0].partId) {
    await db.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [rows[0].qty, rows[0].partId]);
  }
  res.json({ deleted: rows[0].id });
});

// ---------- SERVICES DONE ----------

// POST /api/mechanic/repairs/ACP-9247/services  -> record labour, e.g. "Wheel alignment"
router.post('/repairs/:id/services', async (req, res) => {
  const { name, qty, cost } = req.body || {};
  if (!name || cost === undefined) return res.status(400).json({ error: 'Service name and cost are required.' });

  const repair = await findMyRepair(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Job not found or not assigned to you.' });
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'Start the job before adding services.' });
  }

  const [insert] = await db.query(
    'INSERT INTO repair_services (repairId, name, qty, cost) VALUES (?, ?, ?, ?)',
    [repair.id, name, Number(qty) || 1, cost]
  );
  res.status(201).json({ id: insert.insertId, name, qty: Number(qty) || 1, cost });
});

// DELETE /api/mechanic/repairs/ACP-9247/services/2  -> remove a wrong service line
router.delete('/repairs/:id/services/:rowId', async (req, res) => {
  const repair = await findMyRepair(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Job not found or not assigned to you.' });
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'You can only change services while the job is in progress.' });
  }
  const [result] = await db.query('DELETE FROM repair_services WHERE id = ? AND repairId = ?', [req.params.rowId, repair.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Service entry not found.' });
  res.json({ deleted: Number(req.params.rowId) });
});

// ---------- REPORTS ----------

// GET /api/mechanic/reports  -> my work summary
router.get('/reports', async (req, res) => {
  const me = req.user.id;

  const [byStatus] = await db.query(
    'SELECT status, COUNT(*) AS total FROM repairs WHERE mechanicId = ? GROUP BY status', [me]);
  const jobs = { pending: 0, progress: 0, complete: 0, cancelled: 0 };
  byStatus.forEach(row => { jobs[row.status] = row.total; });

  const [[month]] = await db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(cost), 0) AS earned FROM repairs
     WHERE mechanicId = ? AND status = 'complete'
       AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`, [me]);

  const [[parts]] = await db.query(
    `SELECT COALESCE(SUM(p.qty), 0) AS total FROM repair_parts p
     JOIN repairs r ON r.id = p.repairId WHERE r.mechanicId = ?`, [me]);

  const [recent] = await db.query(
    `SELECT id, vehicle, plate, service, cost, date FROM repairs
     WHERE mechanicId = ? AND status = 'complete' ORDER BY date DESC LIMIT 5`, [me]);

  res.json({
    jobs,
    completedThisMonth: month.total,
    earnedThisMonth: Number(month.earned),
    partsUsed: Number(parts.total),
    recentCompleted: recent
  });
});

// ---------- PROFILE ----------

const PROFILE_FIELDS = 'id, name, email, phone, specialization, experience, status, photo, joined';

// GET /api/mechanic/profile
router.get('/profile', async (req, res) => {
  const [rows] = await db.query(`SELECT ${PROFILE_FIELDS} FROM mechanics WHERE id = ?`, [req.user.id]);
  res.json(rows[0]);
});

// PATCH /api/mechanic/profile  -> mechanic can change phone, specialization, experience,
// photo and availability (name and email are controlled by the admin)
router.patch('/profile', async (req, res) => {
  const body = req.body || {};
  if (body.status && !['active', 'busy', 'leave'].includes(body.status)) {
    return res.status(400).json({ error: 'Status must be active, busy or leave.' });
  }
  const allowed = ['phone', 'specialization', 'experience', 'photo', 'status'];
  const fields = allowed.filter(f => body[f] !== undefined);
  if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update.' });

  const sql = 'UPDATE mechanics SET ' + fields.map(f => f + ' = ?').join(', ') + ' WHERE id = ?';
  await db.query(sql, [...fields.map(f => body[f]), req.user.id]);

  const [rows] = await db.query(`SELECT ${PROFILE_FIELDS} FROM mechanics WHERE id = ?`, [req.user.id]);
  res.json(rows[0]);
});

// PATCH /api/mechanic/profile/password  -> change my password
router.patch('/profile/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Enter your current and new password.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const [rows] = await db.query('SELECT password FROM mechanics WHERE id = ?', [req.user.id]);
  const correct = await bcrypt.compare(currentPassword, rows[0].password);
  if (!correct) return res.status(401).json({ error: 'Current password is wrong.' });

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE mechanics SET password = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ message: 'Password changed.' });
});

module.exports = router;