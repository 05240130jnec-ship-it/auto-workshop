// models/orderModel.js — the MySQL table `orders` (purchase orders to suppliers).

const db = require('../config/db');

const SELECT_ORDER = `
  SELECT o.*, i.name AS partName, i.stock AS currentStock, s.name AS supplierName
  FROM orders o
  LEFT JOIN inventory i ON i.id = o.partId
  LEFT JOIN suppliers s ON s.id = o.supplierId`;

async function findAll(status) {
  if (status) {
    const [rows] = await db.query(SELECT_ORDER + ' WHERE o.status = ? ORDER BY o.date DESC', [status]);
    return rows;
  }
  const [rows] = await db.query(SELECT_ORDER + ' ORDER BY o.date DESC');
  return rows;
}

// One order with the part and supplier names
async function findOne(id) {
  const [rows] = await db.query(SELECT_ORDER + ' WHERE o.id = ?', [id]);
  return rows[0];
}

// Just the order row
async function findById(id) {
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
  return rows[0];
}

// Next id: PO-2211, PO-2212 …
async function nextId() {
  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) AS last FROM orders');
  return 'PO-' + ((last[0].last || 2210) + 1);
}

async function create({ id, partId, qty, supplierId, requestedBy, status, note }) {
  await db.query(
    `INSERT INTO orders (id, partId, qty, supplierId, requestedBy, status, date, note)
     VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
    [id, partId, qty, supplierId, requestedBy, status, note]
  );
}

async function setStatus(id, status) {
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
}

async function setNote(id, note) {
  await db.query('UPDATE orders SET note = ? WHERE id = ?', [note, id]);
}

async function countPending() {
  const [[row]] = await db.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'");
  return row.total;
}

module.exports = { findAll, findOne, findById, nextId, create, setStatus, setNote, countPending };
