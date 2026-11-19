// models/leaveModel.js — the MySQL table `leave_requests` (a mechanic asks for leave, the admin decides).
//   status: pending  -> waiting for the admin
//           approved -> the admin said yes (the mechanic is "On leave" from fromDate to toDate)
//           rejected -> the admin said no
//           finished -> the leave is over, the mechanic is back at work
//           cancelled-> the mechanic took back the request before the admin decided

const db = require('../config/db');

const SELECT = `
  SELECT l.*, m.name AS mechanicName
  FROM leave_requests l
  JOIN mechanics m ON m.id = l.mechanicId`;

async function findByMechanic(mechanicId) {
  const [rows] = await db.query(SELECT + ' WHERE l.mechanicId = ? ORDER BY l.fromDate DESC', [mechanicId]);
  return rows;
}

async function findAll() {
  const [rows] = await db.query(SELECT + ' ORDER BY (l.status = \'pending\') DESC, l.fromDate DESC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(SELECT + ' WHERE l.id = ?', [id]);
  return rows[0];
}

// Another pending/approved leave of this mechanic that overlaps these dates?
async function overlaps(mechanicId, fromDate, toDate) {
  const [rows] = await db.query(
    `SELECT id FROM leave_requests
     WHERE mechanicId = ? AND status IN ('pending', 'approved') AND fromDate <= ? AND toDate >= ?`,
    [mechanicId, toDate, fromDate]);
  return rows.length > 0;
}

// Next id: LV-1001, LV-1002 …
async function nextId() {
  const [rows] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) AS last FROM leave_requests');
  return 'LV-' + ((rows[0].last || 1000) + 1);
}

async function create({ id, mechanicId, fromDate, toDate, reason }) {
  await db.query(
    `INSERT INTO leave_requests (id, mechanicId, fromDate, toDate, reason, status, date)
     VALUES (?, ?, ?, ?, ?, 'pending', CURDATE())`,
    [id, mechanicId, fromDate, toDate, reason]);
}

async function setStatus(id, status, adminNote) {
  await db.query('UPDATE leave_requests SET status = ?, adminNote = ?, decidedAt = CURDATE() WHERE id = ?',
    [status, adminNote || null, id]);
}

// Keeps the mechanics' status in step with the approved leaves (runs when the admin or the
// mechanic loads their pages, so nobody has to remember to switch it by hand):
//   - an approved leave has started -> the mechanic is "On leave" and his open jobs go back
//     to "Pending" without a mechanic, so the admin can give them to someone else
//   - an approved leave is over      -> the mechanic is "Working" again
async function applyLeaves() {
  const [starting] = await db.query(
    `SELECT l.mechanicId FROM leave_requests l JOIN mechanics m ON m.id = l.mechanicId
     WHERE l.status = 'approved' AND l.fromDate <= CURDATE() AND l.toDate >= CURDATE() AND m.status <> 'leave'`);
  for (const { mechanicId } of starting) {
    await db.query("UPDATE repairs SET mechanicId = NULL, status = 'pending' WHERE mechanicId = ? AND status IN ('pending', 'progress')", [mechanicId]);
    await db.query("UPDATE mechanics SET status = 'leave' WHERE id = ?", [mechanicId]);
  }
  const [ended] = await db.query(
    "SELECT id, mechanicId FROM leave_requests WHERE status = 'approved' AND toDate < CURDATE()");
  for (const l of ended) {
    await db.query("UPDATE leave_requests SET status = 'finished' WHERE id = ?", [l.id]);
    const [still] = await db.query(
      `SELECT id FROM leave_requests WHERE mechanicId = ? AND status = 'approved'
       AND fromDate <= CURDATE() AND toDate >= CURDATE()`, [l.mechanicId]);
    if (!still.length) await db.query("UPDATE mechanics SET status = 'active' WHERE id = ? AND status = 'leave'", [l.mechanicId]);
  }
}

// The admin set the mechanic back to work early -> his current approved leave is over
async function endCurrent(mechanicId) {
  await db.query(
    `UPDATE leave_requests SET status = 'finished'
     WHERE mechanicId = ? AND status = 'approved' AND fromDate <= CURDATE()`, [mechanicId]);
}

module.exports = { findByMechanic, findAll, findById, overlaps, nextId, create, setStatus, applyLeaves, endCurrent };
