// models/supplierModel.js — the MySQL table `suppliers`.

const db = require('../config/db');
const { updateFields, deleteById } = require('./helpers');

// All suppliers + how many parts each supplies
async function findAll() {
  const [rows] = await db.query(`
    SELECT s.*, (SELECT COUNT(*) FROM inventory i WHERE i.supplierId = s.id) AS partCount
    FROM suppliers s ORDER BY s.id`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM suppliers WHERE id = ?', [id]);
  return rows[0];
}

// Next id: S-01, S-02 …
async function nextId() {
  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM suppliers');
  return 'S-' + String((last[0].last || 0) + 1).padStart(2, '0');
}

async function create({ id, name, person, phone, email, address }) {
  await db.query(
    'INSERT INTO suppliers (id, name, person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, person, phone, email, address]
  );
}

const update = (id, values) => updateFields('suppliers', id, values);
const remove = (id) => deleteById('suppliers', id);

module.exports = { findAll, findById, nextId, create, update, remove };
