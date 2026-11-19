// models/repairModel.js — the MySQL tables `repairs`, `repair_parts` and `repair_services`.
// Customers, the admin and mechanics all see repairs, but each one with different extra columns.

const db = require('../config/db');
const { updateFields, deleteById } = require('./helpers');

// The customer sees who the mechanic is
const SELECT_FOR_CUSTOMER = `
  SELECT r.*, m.name AS mechanicName
  FROM repairs r
  LEFT JOIN mechanics m ON m.id = r.mechanicId`;

// The admin sees the customer and the mechanic
const SELECT_FOR_ADMIN = `
  SELECT r.*, c.name AS customerName, c.phone AS customerPhone, m.name AS mechanicName
  FROM repairs r
  JOIN customers c ON c.id = r.customerId
  LEFT JOIN mechanics m ON m.id = r.mechanicId`;

// The mechanic sees the customer
const SELECT_FOR_MECHANIC = `
  SELECT r.*, c.name AS customerName, c.phone AS customerPhone
  FROM repairs r
  JOIN customers c ON c.id = r.customerId`;

// ---------- ids ----------

// Next repair id: ACP-9226, ACP-9227 …
async function nextId() {
  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS last FROM repairs');
  return 'ACP-' + ((last[0].last || 9225) + 1);
}

// ---------- parts and services of a repair ----------

async function findParts(repairId) {
  const [rows] = await db.query('SELECT * FROM repair_parts WHERE repairId = ?', [repairId]);
  return rows;
}

async function findServices(repairId) {
  const [rows] = await db.query('SELECT * FROM repair_services WHERE repairId = ?', [repairId]);
  return rows;
}

// Parts and services of many repairs at once (2 queries for all jobs, not 2 per job)
async function findPartsOfMany(ids) {
  const [rows] = await db.query('SELECT * FROM repair_parts WHERE repairId IN (?)', [ids]);
  return rows;
}

async function findServicesOfMany(ids) {
  const [rows] = await db.query('SELECT * FROM repair_services WHERE repairId IN (?)', [ids]);
  return rows;
}

// Adds up parts + services for a repair
async function totalCost(repairId) {
  const [[p]] = await db.query('SELECT COALESCE(SUM(qty * price), 0) AS total FROM repair_parts WHERE repairId = ?', [repairId]);
  const [[s]] = await db.query('SELECT COALESCE(SUM(qty * cost), 0) AS total FROM repair_services WHERE repairId = ?', [repairId]);
  return Number(p.total) + Number(s.total);
}

// ---------- CUSTOMER ----------

async function findByCustomer(customerId) {
  const [rows] = await db.query(SELECT_FOR_CUSTOMER + ' WHERE r.customerId = ? ORDER BY r.date DESC', [customerId]);
  return rows;
}

async function findOneOfCustomer(id, customerId) {
  const [rows] = await db.query(SELECT_FOR_CUSTOMER + ' WHERE r.id = ? AND r.customerId = ?', [id, customerId]);
  return rows[0];
}

// How many cars are booked in each time slot of a day: [{ apptTime, booked }]
async function countBySlot(date) {
  const [rows] = await db.query(
    "SELECT apptTime, COUNT(*) AS booked FROM repairs WHERE apptDate = ? AND status <> 'cancelled' GROUP BY apptTime",
    [date]
  );
  return rows;
}

// How many cars are booked in one time slot
async function countInSlot(date, time) {
  const [count] = await db.query(
    "SELECT COUNT(*) AS booked FROM repairs WHERE apptDate = ? AND apptTime = ? AND status <> 'cancelled'",
    [date, time]
  );
  return count[0].booked;
}

// A customer books a repair (status pending, date today)
async function createBooking(r) {
  await db.query(
    `INSERT INTO repairs (id, customerId, vehicleType, vehicle, plate, service, status, priority, date, cost, notes, apptDate, apptTime, delivery)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 'normal', CURDATE(), ?, ?, ?, ?, ?)`,
    [r.id, r.customerId, r.vehicleType, r.vehicle, r.plate, r.service, r.cost, r.notes, r.apptDate, r.apptTime, r.delivery]
  );
}

// The status of a customer's repair, or undefined if it is not theirs
async function findStatusOfCustomer(id, customerId) {
  const [rows] = await db.query('SELECT status FROM repairs WHERE id = ? AND customerId = ?', [id, customerId]);
  return rows.length ? rows[0].status : undefined;
}

async function cancel(id) {
  await db.query("UPDATE repairs SET status = 'cancelled' WHERE id = ?", [id]);
}

async function countOfCustomer(customerId) {
  const [[jobs]] = await db.query('SELECT COUNT(*) AS total FROM repairs WHERE customerId = ?', [customerId]);
  return jobs.total;
}

// ---------- ADMIN ----------

async function findAll(status) {
  if (status) {
    const [rows] = await db.query(SELECT_FOR_ADMIN + ' WHERE r.status = ? ORDER BY r.date DESC', [status]);
    return rows;
  }
  const [rows] = await db.query(SELECT_FOR_ADMIN + ' ORDER BY r.date DESC');
  return rows;
}

async function findOneForAdmin(id) {
  const [rows] = await db.query(SELECT_FOR_ADMIN + ' WHERE r.id = ?', [id]);
  return rows[0];
}

// values = only the fields to change. null = nothing to change, false = not found
const update = (id, values) => updateFields('repairs', id, values);

// The admin creates a job (e.g. a walk-in customer)
async function createByAdmin(r) {
  await db.query(
    `INSERT INTO repairs (id, customerId, vehicleType, vehicle, plate, service, mechanicId, status, priority, date, due, cost, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.id, r.customerId, r.vehicleType, r.vehicle, r.plate, r.service, r.mechanicId,
     r.status, r.priority, r.date, r.due, r.cost, r.notes]
  );
}

const remove = (id) => deleteById('repairs', id);   // its parts and services go too

// { pending: 5, progress: 2, ... } (for one mechanic when mechanicId is given)
async function countByStatus(mechanicId) {
  const [byStatus] = mechanicId
    ? await db.query('SELECT status, COUNT(*) AS total FROM repairs WHERE mechanicId = ? GROUP BY status', [mechanicId])
    : await db.query('SELECT status, COUNT(*) AS total FROM repairs GROUP BY status');
  const counts = { pending: 0, progress: 0, complete: 0, cancelled: 0 };
  byStatus.forEach((row) => { counts[row.status] = row.total; });
  return counts;
}

async function revenue() {
  const [[row]] = await db.query("SELECT COALESCE(SUM(cost), 0) AS total FROM repairs WHERE status = 'complete'");
  return Number(row.total);
}

// ---------- MECHANIC ----------

// Jobs assigned to this mechanic (optionally only one status), earliest due date first
async function findByMechanic(mechanicId, status) {
  let sql = SELECT_FOR_MECHANIC + ' WHERE r.mechanicId = ?';
  const params = [mechanicId];
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  const [rows] = await db.query(sql + ' ORDER BY r.due IS NULL, r.due, r.date', params);
  return rows;
}

// A repair only if it is assigned to THIS mechanic
async function findOneOfMechanic(id, mechanicId) {
  const [rows] = await db.query(SELECT_FOR_MECHANIC + ' WHERE r.id = ? AND r.mechanicId = ?', [id, mechanicId]);
  return rows[0];
}

async function setStatus(id, status) {
  await db.query('UPDATE repairs SET status = ? WHERE id = ?', [status, id]);
}

async function setCost(id, cost) {
  await db.query('UPDATE repairs SET cost = ? WHERE id = ?', [cost, id]);
}

async function setNotes(id, notes) {
  await db.query('UPDATE repairs SET notes = ? WHERE id = ?', [notes, id]);
}

// Work notes are kept as lines of text: "[2026-10-28] Ugyen Dorji: Replaced the brake pads"
async function addWorkNote(id, line) {
  await db.query('UPDATE repairs SET workNotes = CONCAT_WS(?, workNotes, ?) WHERE id = ?', ['\n', line, id]);
}

// Log a part used on a repair -> the new row id
async function addPart(repairId, part, qty) {
  const [insert] = await db.query(
    'INSERT INTO repair_parts (repairId, partId, name, qty, price, date) VALUES (?, ?, ?, ?, ?, CURDATE())',
    [repairId, part.id, part.name, qty, part.price]
  );
  return insert.insertId;
}

async function findPartRow(rowId, repairId) {
  const [rows] = await db.query('SELECT * FROM repair_parts WHERE id = ? AND repairId = ?', [rowId, repairId]);
  return rows[0];
}

async function removePartRow(rowId) {
  await db.query('DELETE FROM repair_parts WHERE id = ?', [rowId]);
}

// Record labour, e.g. "Wheel alignment" -> the new row id
async function addService(repairId, name, qty, cost) {
  const [insert] = await db.query(
    'INSERT INTO repair_services (repairId, name, qty, cost) VALUES (?, ?, ?, ?)',
    [repairId, name, qty, cost]
  );
  return insert.insertId;
}

// true if the service line was deleted
async function removeServiceRow(rowId, repairId) {
  const [result] = await db.query('DELETE FROM repair_services WHERE id = ? AND repairId = ?', [rowId, repairId]);
  return result.affectedRows > 0;
}

// ----- mechanic reports -----

async function monthSummary(mechanicId) {
  const [[month]] = await db.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(cost), 0) AS earned FROM repairs
     WHERE mechanicId = ? AND status = 'complete'
       AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`, [mechanicId]);
  return month;
}

async function partsUsedBy(mechanicId) {
  const [[parts]] = await db.query(
    `SELECT COALESCE(SUM(p.qty), 0) AS total FROM repair_parts p
     JOIN repairs r ON r.id = p.repairId WHERE r.mechanicId = ?`, [mechanicId]);
  return Number(parts.total);
}

async function recentCompleted(mechanicId) {
  const [recent] = await db.query(
    `SELECT id, vehicle, plate, service, cost, date FROM repairs
     WHERE mechanicId = ? AND status = 'complete' ORDER BY date DESC LIMIT 5`, [mechanicId]);
  return recent;
}

module.exports = {
  nextId, findParts, findServices, findPartsOfMany, findServicesOfMany, totalCost,
  findByCustomer, findOneOfCustomer, countBySlot, countInSlot, createBooking, findStatusOfCustomer, cancel, countOfCustomer,
  findAll, findOneForAdmin, update, createByAdmin, remove, countByStatus, revenue,
  findByMechanic, findOneOfMechanic, setStatus, setCost, setNotes, addWorkNote,
  addPart, findPartRow, removePartRow, addService, removeServiceRow,
  monthSummary, partsUsedBy, recentCompleted,
};
