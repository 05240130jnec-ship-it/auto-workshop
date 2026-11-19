// models/loginAttemptModel.js — the MySQL table `login_attempts` (stops password guessing).
// After 5 wrong passwords for one email, that email is locked for 15 seconds.
// The count is kept in MySQL, so restarting the server does not reset it.

const db = require('../config/db');

const MAX_TRIES = 5;
const LOCK_SECONDS = 15;

// Makes the table the first time someone logs in (so no extra setup step is needed)
let tableReady = null;
function setupTable() {
  if (!tableReady) {
    tableReady = db.query(`CREATE TABLE IF NOT EXISTS login_attempts (
      email varchar(120) NOT NULL PRIMARY KEY,
      fails int NOT NULL DEFAULT 0,
      lockedUntil datetime DEFAULT NULL
    )`).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

// How many seconds this email is still locked for (0 = not locked)
async function secondsLocked(email) {
  const [rows] = await db.query(
    'SELECT TIMESTAMPDIFF(SECOND, NOW(), lockedUntil) AS secs FROM login_attempts WHERE email = ? AND lockedUntil > NOW()',
    [email]);
  return rows.length ? Math.max(1, Number(rows[0].secs)) : 0;
}

// Counts one wrong password. Returns how many tries are left (0 = now locked).
async function countWrongTry(email) {
  // a lock that has ended starts again from 0
  await db.query('UPDATE login_attempts SET fails = 0, lockedUntil = NULL WHERE email = ? AND lockedUntil <= NOW()', [email]);
  await db.query(
    'INSERT INTO login_attempts (email, fails) VALUES (?, 1) ON DUPLICATE KEY UPDATE fails = fails + 1',
    [email]);
  const [[row]] = await db.query('SELECT fails FROM login_attempts WHERE email = ?', [email]);
  if (row.fails >= MAX_TRIES) {
    await db.query(
      `UPDATE login_attempts SET fails = 0, lockedUntil = NOW() + INTERVAL ${LOCK_SECONDS} SECOND WHERE email = ?`,
      [email]);
    return 0;
  }
  return MAX_TRIES - row.fails;
}

// A correct login (or a new password) clears the wrong tries
async function clear(email) {
  await db.query('DELETE FROM login_attempts WHERE email = ?', [email]);
}

module.exports = { LOCK_SECONDS, setupTable, secondsLocked, countWrongTry, clear };
