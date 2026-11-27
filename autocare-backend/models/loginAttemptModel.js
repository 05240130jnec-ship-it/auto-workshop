// models/loginAttemptModel.js — the MySQL table `login_attempts` (stops password guessing).
// The waiting time gets longer every time someone keeps guessing:
//   5 wrong passwords            -> locked 15 seconds
//   then 3 more wrong passwords  -> locked 30 seconds
//   then 3 more                  -> 1 minute, then 2, 4, 8 ... up to 15 minutes at most
// A correct login (or a new password) starts everything again from the beginning.
// The count is kept in MySQL, so restarting the server does not reset it.

const db = require('../config/db');

const FIRST_TRIES = 5;          // wrong passwords before the first lock
const NEXT_TRIES = 3;           // wrong passwords before each next lock
const LOCK_SECONDS = 15;        // first lock
const MAX_LOCK_SECONDS = 15 * 60;

// Lock time for the next lock: 15, 30, 60, 120 ... seconds (locks = how many locks already happened)
function lockTime(locks) {
  return Math.min(LOCK_SECONDS * 2 ** locks, MAX_LOCK_SECONDS);
}

// Makes the table the first time someone logs in (so no extra setup step is needed)
let tableReady = null;
function setupTable() {
  if (!tableReady) {
    tableReady = (async () => {
      await db.query(`CREATE TABLE IF NOT EXISTS login_attempts (
        email varchar(120) NOT NULL PRIMARY KEY,
        fails int NOT NULL DEFAULT 0,
        locks int NOT NULL DEFAULT 0,
        lockedUntil datetime DEFAULT NULL
      )`);
      // older databases do not have the "locks" column yet
      await db.query('ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS locks int NOT NULL DEFAULT 0 AFTER fails');
    })().catch((err) => { tableReady = null; throw err; });
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

// Counts one wrong password.
// Returns { left, lock }: left = tries left before the next lock (0 = locked now),
// lock = seconds of that lock.
async function countWrongTry(email) {
  // a lock that has ended: count the tries again from 0, but remember how many locks there were
  await db.query('UPDATE login_attempts SET fails = 0, lockedUntil = NULL WHERE email = ? AND lockedUntil <= NOW()', [email]);
  await db.query(
    'INSERT INTO login_attempts (email, fails) VALUES (?, 1) ON DUPLICATE KEY UPDATE fails = fails + 1',
    [email]);
  const [[row]] = await db.query('SELECT fails, locks FROM login_attempts WHERE email = ?', [email]);
  const allowed = row.locks === 0 ? FIRST_TRIES : NEXT_TRIES;
  const lock = lockTime(row.locks);
  if (row.fails >= allowed) {
    await db.query(
      'UPDATE login_attempts SET fails = 0, locks = locks + 1, lockedUntil = NOW() + INTERVAL ? SECOND WHERE email = ?',
      [lock, email]);
    return { left: 0, lock };
  }
  return { left: allowed - row.fails, lock };
}

// A correct login (or a new password) clears the wrong tries and the locks
async function clear(email) {
  await db.query('DELETE FROM login_attempts WHERE email = ?', [email]);
}

// 15 -> "15 seconds", 60 -> "1 minute", 90 -> "1 minute 30 seconds"
function waitText(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  const part = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
  if (!m) return part(s, 'second');
  return s ? `${part(m, 'minute')} ${part(s, 'second')}` : part(m, 'minute');
}

module.exports = { setupTable, secondsLocked, countWrongTry, clear, waitText };
