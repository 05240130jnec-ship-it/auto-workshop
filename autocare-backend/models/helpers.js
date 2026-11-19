// models/helpers.js — small SQL helpers that many models use.

const db = require('../config/db');

// Keeps only the allowed fields that were sent:
// onlyFields({ name: 'A', x: 1 }, ['name', 'phone']) -> { name: 'A' }
function onlyFields(body, allowed) {
  const out = {};
  allowed.forEach((f) => { if (body[f] !== undefined) out[f] = body[f]; });
  return out;
}

// UPDATE <table> SET a = ?, b = ? WHERE id = ?
// Returns null if there is nothing to change, false if the id was not found, true if it worked.
async function updateFields(table, id, values) {
  const cols = Object.keys(values);
  if (cols.length === 0) return null;
  const [result] = await db.query(
    `UPDATE ${table} SET ${cols.map((c) => c + ' = ?').join(', ')} WHERE id = ?`, [...Object.values(values), id]);
  return result.affectedRows > 0;
}

// INSERT INTO <table> (a, b) VALUES (?, ?)  -> the new auto-number id
async function insertRow(table, values) {
  const cols = Object.keys(values);
  const [result] = await db.query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, Object.values(values));
  return result.insertId;
}

// DELETE FROM <table> WHERE id = ?  -> true if a row was deleted
async function deleteById(table, id) {
  const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

module.exports = { onlyFields, updateFields, insertRow, deleteById };
