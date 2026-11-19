// models/listingModel.js — the MySQL table `listings` (customers selling their own parts).

const db = require('../config/db');

async function findByCustomer(customerId) {
  const [rows] = await db.query(
    'SELECT * FROM listings WHERE customerId = ? ORDER BY date DESC', [customerId]
  );
  return rows;
}

// Admin: all listings with the customer (optionally one status), newest first
async function findAll(status) {
  let sql = `
    SELECT l.*, c.name AS customerName, c.phone AS customerPhone
    FROM listings l
    JOIN customers c ON c.id = l.customerId`;
  const params = [];
  if (status) {
    sql += ' WHERE l.status = ?';
    params.push(status);
  }
  const [rows] = await db.query(sql + ' ORDER BY l.date DESC', params);
  return rows;
}

// The status of a listing, or undefined if not found
async function findStatus(id) {
  const [rows] = await db.query('SELECT status FROM listings WHERE id = ?', [id]);
  return rows.length ? rows[0].status : undefined;
}

// Next id: L-101, L-102 …
async function nextId() {
  const [rows] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM listings');
  return 'L-' + ((rows[0].last || 100) + 1);
}

// photos = the pictures as text ("data:image/jpeg;base64,…"), one per line
async function create({ id, customerId, name, category, condition, price, qty, description, photos }) {
  await db.query(
    `INSERT INTO listings (id, customerId, name, category, item_condition, price, qty, description, photos, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'review', CURDATE())`,
    [id, customerId, name, category, condition, price, qty, description, photos]
  );
}

async function setStatus(id, status) {
  await db.query('UPDATE listings SET status = ? WHERE id = ?', [status, id]);
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM listings WHERE id = ?', [id]);
  return rows[0];
}

// The workshop bought the part: remember which inventory part it became
async function markBought(id, partId) {
  await db.query("UPDATE listings SET status = 'bought', partId = ? WHERE id = ?", [partId, id]);
}

async function countInReview() {
  const [[row]] = await db.query("SELECT COUNT(*) AS total FROM listings WHERE status = 'review'");
  return row.total;
}

module.exports = { findByCustomer, findAll, findStatus, nextId, create, setStatus, findById, markBought, countInReview };
