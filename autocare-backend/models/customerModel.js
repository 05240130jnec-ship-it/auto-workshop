// models/customerModel.js — the MySQL table `customers`.

const db = require('../config/db');
const { updateFields, deleteById } = require('./helpers');

const PROFILE_FIELDS = 'id, name, email, phone, address, photo, joined';   // "My profile"
const ADMIN_FIELDS = 'id, name, email, phone, address, status, joined, photo';    // admin list

// Next customer id: C-001, C-002 … -> C-009
async function nextId() {
  const [rows] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS n FROM customers');
  return 'C-' + String((rows[0].n || 0) + 1).padStart(3, '0');
}

// Add a customer (password = the bcrypt hash). joined = today.
async function create({ id, name, email, phone, address, password, status }) {
  await db.query(
    'INSERT INTO customers (id, name, email, phone, address, password, status, joined) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())',
    [id, name, email, phone, address, password, status]);
}

async function exists(id) {
  const [rows] = await db.query('SELECT id FROM customers WHERE id = ?', [id]);
  return rows.length > 0;
}

// ----- My profile (the customer) -----

async function findProfile(id) {
  const [rows] = await db.query(`SELECT ${PROFILE_FIELDS} FROM customers WHERE id = ?`, [id]);
  return rows[0];
}

async function updateDetails(id, { name, phone, address }) {
  await db.query('UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, id]);
}

async function setPhoto(id, photo) {
  if (photo === null) await db.query('UPDATE customers SET photo = NULL WHERE id = ?', [id]);
  else await db.query('UPDATE customers SET photo = ? WHERE id = ?', [photo, id]);
}

// The password hash, or undefined if the account is not found
async function getPasswordHash(id) {
  const [rows] = await db.query('SELECT password FROM customers WHERE id = ?', [id]);
  return rows.length ? rows[0].password : undefined;
}

async function setPassword(id, hash) {
  await db.query('UPDATE customers SET password = ? WHERE id = ?', [hash, id]);
}

// ----- Admin -----

// All customers + how many repairs each has
async function findAllWithRepairCount() {
  const [rows] = await db.query(`
    SELECT ${ADMIN_FIELDS},
      (SELECT COUNT(*) FROM repairs r WHERE r.customerId = customers.id) AS repairCount
    FROM customers ORDER BY id`);
  return rows;
}

async function findForAdmin(id) {
  const [rows] = await db.query(`SELECT ${ADMIN_FIELDS} FROM customers WHERE id = ?`, [id]);
  return rows[0];
}

// active / inactive. Returns false if the id was not found.
const setStatus = (id, status) => updateFields('customers', id, { status });

async function countActive() {
  const [[row]] = await db.query("SELECT COUNT(*) AS total FROM customers WHERE status = 'active'");
  return row.total;
}

const remove = (id) => deleteById('customers', id);

module.exports = {
  nextId, create, exists, findProfile, updateDetails, setPhoto, getPasswordHash, setPassword,
  findAllWithRepairCount, findForAdmin, setStatus, countActive, remove,
};
