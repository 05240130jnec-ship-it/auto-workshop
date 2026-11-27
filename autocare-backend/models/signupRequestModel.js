// models/signupRequestModel.js — the MySQL table `signup_requests`.
// A new sign-up is NOT a customer yet. It waits here until the owner of the email
// clicks "Yes, it's me" in the email we send. "No, it's not me" deletes it.
// The link has a long random token; only its SHA-256 hash is saved here.

const crypto = require('crypto');
const db = require('../config/db');

let tableReady = null;
function setupTable() {
  if (!tableReady) {
    tableReady = db.query(`CREATE TABLE IF NOT EXISTS signup_requests (
      email varchar(120) NOT NULL PRIMARY KEY,
      name varchar(100) NOT NULL,
      phone varchar(30) DEFAULT NULL,
      address varchar(200) DEFAULT NULL,
      password varchar(255) NOT NULL,
      tokenHash char(64) NOT NULL,
      expiresAt datetime NOT NULL,
      createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY tokenHash (tokenHash)
    )`).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

const hashOf = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

// Seconds to wait if an email was sent to this address in the last `seconds` seconds (0 = no wait)
async function secondsToWait(email, seconds) {
  const [rows] = await db.query(
    'SELECT ? - TIMESTAMPDIFF(SECOND, createdAt, NOW()) AS wait FROM signup_requests WHERE email = ? AND createdAt > NOW() - INTERVAL ? SECOND',
    [seconds, email, seconds]);
  return rows.length ? Math.max(1, Number(rows[0].wait)) : 0;
}

// Saves the sign-up (replaces an older one for the same email). Returns the token for the email link.
async function save({ name, email, phone, address, password }, hours) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.query(
    `REPLACE INTO signup_requests (email, name, phone, address, password, tokenHash, expiresAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL ? HOUR, NOW())`,
    [email, name, phone, address, password, hashOf(token), hours]);
  return token;
}

// The sign-up for this link (only if it has not expired)
async function findByToken(token) {
  const [rows] = await db.query('SELECT * FROM signup_requests WHERE tokenHash = ? AND expiresAt > NOW()', [hashOf(token)]);
  return rows[0] || null;
}

// Is a sign-up for this email still waiting for the "Yes"?
async function isWaiting(email) {
  const [rows] = await db.query('SELECT email FROM signup_requests WHERE email = ? AND expiresAt > NOW()', [email]);
  return rows.length > 0;
}

async function remove(email) {
  await db.query('DELETE FROM signup_requests WHERE email = ?', [email]);
}

module.exports = { setupTable, secondsToWait, save, findByToken, isWaiting, remove };
