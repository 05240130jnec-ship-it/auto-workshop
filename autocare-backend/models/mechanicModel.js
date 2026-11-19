// models/mechanicModel.js — the MySQL table `mechanics`.

const db = require('../config/db');
const { updateFields, deleteById } = require('./helpers');

const FIELDS = 'id, name, email, phone, specialization, experience, status, photo, joined';   // never the password

// All mechanics + how many open jobs each has (admin)
async function findAllWithOpenJobs() {
  const [rows] = await db.query(`
    SELECT ${FIELDS},
      (SELECT COUNT(*) FROM repairs r
       WHERE r.mechanicId = mechanics.id AND r.status IN ('pending', 'progress')) AS openJobs
    FROM mechanics ORDER BY id`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`SELECT ${FIELDS} FROM mechanics WHERE id = ?`, [id]);
  return rows[0];
}

async function exists(id) {
  const [rows] = await db.query('SELECT id FROM mechanics WHERE id = ?', [id]);
  return rows.length > 0;
}

// Next id: M-001, M-002 … -> M-006
async function nextId() {
  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM mechanics');
  return 'M-' + String((last[0].last || 0) + 1).padStart(3, '0');
}

async function create({ id, name, email, phone, password, specialization, experience, status, joined }) {
  await db.query(
    `INSERT INTO mechanics (id, name, email, phone, password, specialization, experience, status, joined)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, phone, password, specialization, experience, status, joined]);
}

// values = only the fields to change. null = nothing to change, false = not found
const update = (id, values) => updateFields('mechanics', id, values);
const remove = (id) => deleteById('mechanics', id);

async function countAvailable() {
  const [[row]] = await db.query("SELECT COUNT(*) AS total FROM mechanics WHERE status <> 'leave'");
  return row.total;
}

async function countOpenJobs(id) {
  const [[open]] = await db.query(
    "SELECT COUNT(*) AS n FROM repairs WHERE mechanicId = ? AND status IN ('pending', 'progress')", [id]);
  return Number(open.n);
}

async function getPasswordHash(id) {
  const [rows] = await db.query('SELECT password FROM mechanics WHERE id = ?', [id]);
  return rows[0].password;
}

async function setPassword(id, hash) {
  await db.query('UPDATE mechanics SET password = ? WHERE id = ?', [hash, id]);
}

module.exports = {
  findAllWithOpenJobs, findById, exists, nextId, create, update, remove,
  countAvailable, countOpenJobs, getPasswordHash, setPassword,
};
