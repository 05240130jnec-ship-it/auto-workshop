// models/adminModel.js — the MySQL table `admins` (the admin's own profile).

const db = require('../config/db');
const { updateFields } = require('./helpers');

const FIELDS = 'id, name, email, phone, photo';

async function findById(id) {
  const [rows] = await db.query(`SELECT ${FIELDS} FROM admins WHERE id = ?`, [id]);
  return rows[0];
}

const update = (id, values) => updateFields('admins', id, values);

// The password hash, or undefined if the admin is not found
async function getPasswordHash(id) {
  const [rows] = await db.query('SELECT password FROM admins WHERE id = ?', [id]);
  return rows.length ? rows[0].password : undefined;
}

async function setPassword(id, hash) {
  await db.query('UPDATE admins SET password = ? WHERE id = ?', [hash, id]);
}

module.exports = { findById, update, getPasswordHash, setPassword };
