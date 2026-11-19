// models/userModel.js — things that look at ALL 3 account tables (admins, mechanics, customers).

const db = require('../config/db');

const TABLE_OF = { admin: 'admins', mechanic: 'mechanics', customer: 'customers' };

// Find an account by email in the 3 user tables (adds role: admin / mechanic / customer)
async function findByEmail(email) {
  const [a] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
  if (a.length) return { ...a[0], role: 'admin' };
  const [m] = await db.query('SELECT * FROM mechanics WHERE email = ?', [email]);
  if (m.length) return { ...m[0], role: 'mechanic' };
  const [c] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
  if (c.length) return { ...c[0], role: 'customer' };
  return null;
}

// Is this email already used by any account? (exceptId = the account being edited)
async function emailTaken(email, exceptId = '') {
  for (const table of ['admins', 'mechanics', 'customers']) {
    const [rows] = await db.query(`SELECT id FROM ${table} WHERE email = ? AND id <> ?`, [email, exceptId]);
    if (rows.length > 0) return true;
  }
  return false;
}

// Save a new password hash for an account of any role
async function setPassword(role, id, hash) {
  await db.query(`UPDATE ${TABLE_OF[role]} SET password = ? WHERE id = ?`, [hash, id]);
}

module.exports = { findByEmail, emailTaken, setPassword };
