// models/reservationModel.js — the MySQL table `reservations` (customers reserve workshop parts).

const db = require('../config/db');

async function findByCustomer(customerId) {
  const [rows] = await db.query(
    'SELECT * FROM reservations WHERE customerId = ? ORDER BY date DESC', [customerId]
  );
  return rows;
}

async function findOneOfCustomer(id, customerId) {
  const [rows] = await db.query(
    'SELECT * FROM reservations WHERE id = ? AND customerId = ?', [id, customerId]
  );
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
  return rows[0];
}

// Admin: all reservations with the customer (optionally one status), soonest pickup first
async function findAll(status) {
  let sql = `
    SELECT r.*, c.name AS customerName, c.phone AS customerPhone
    FROM reservations r
    JOIN customers c ON c.id = r.customerId`;
  const params = [];
  if (status) {
    sql += ' WHERE r.status = ?';
    params.push(status);
  }
  // newest order first (R-1012 above R-1011)
  const [rows] = await db.query(sql + ' ORDER BY r.date DESC, CAST(SUBSTRING(r.id, 3) AS UNSIGNED) DESC', params);
  return rows;
}

// Next id: R-1001, R-1002 …
async function nextId() {
  const [rows] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM reservations');
  return 'R-' + ((rows[0].last || 1000) + 1);
}

async function create({ id, customerId, slug, name, price, qty, pickup }) {
  await db.query(
    `INSERT INTO reservations (id, customerId, slug, name, price, qty, pickup, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', CURDATE())`,
    [id, customerId, slug, name, price, qty, pickup]
  );
}

async function setStatus(id, status) {
  await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
}

// Payment received (the customer paid through WhatsApp, the admin checked it)
async function setPaid(id, paid) {
  await db.query('UPDATE reservations SET paid = ?, paidAt = ? WHERE id = ?', [paid ? 1 : 0, paid ? new Date() : null, id]);
}

module.exports = { findByCustomer, findOneOfCustomer, findById, findAll, nextId, create, setStatus, setPaid };
