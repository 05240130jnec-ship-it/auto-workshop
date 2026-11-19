// models/passwordResetModel.js — the MySQL table `password_resets` (forgot password codes).
// The 6-digit code is saved as a bcrypt HASH, never as plain text.

const db = require('../config/db');

let tableReady = null;
function setupTable() {
  if (!tableReady) {
    tableReady = db.query(`CREATE TABLE IF NOT EXISTS password_resets (
      email varchar(120) NOT NULL PRIMARY KEY,
      codeHash varchar(255) NOT NULL,
      tries int NOT NULL DEFAULT 0,
      expiresAt datetime NOT NULL,
      createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

// Seconds to wait if a code was sent to this email in the last `seconds` seconds (0 = no wait)
async function secondsToWait(email, seconds) {
  const [recent] = await db.query(
    'SELECT ? - TIMESTAMPDIFF(SECOND, createdAt, NOW()) AS wait FROM password_resets WHERE email = ? AND createdAt > NOW() - INTERVAL ? SECOND',
    [seconds, email, seconds]);
  return recent.length ? Math.max(1, Number(recent[0].wait)) : 0;
}

// Save a new code (replaces an older code for the same email)
async function save(email, codeHash, minutes) {
  await db.query(
    `INSERT INTO password_resets (email, codeHash, tries, expiresAt, createdAt)
       VALUES (?, ?, 0, NOW() + INTERVAL ${minutes} MINUTE, NOW())
       ON DUPLICATE KEY UPDATE codeHash = VALUES(codeHash), tries = 0, expiresAt = VALUES(expiresAt), createdAt = NOW()`,
    [email, codeHash]);
}

// The saved code: { codeHash, tries, valid (1 = not expired) } or undefined
async function find(email) {
  const [rows] = await db.query('SELECT codeHash, tries, expiresAt > NOW() AS valid FROM password_resets WHERE email = ?', [email]);
  return rows[0];
}

async function addTry(email) {
  await db.query('UPDATE password_resets SET tries = tries + 1 WHERE email = ?', [email]);
}

async function remove(email) {
  await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
}

module.exports = { setupTable, secondsToWait, save, find, addTry, remove };
