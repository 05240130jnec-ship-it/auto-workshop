// db.js — connects the backend to the MySQL database.
// Other files use it with:  const db = require('./db');

require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,         // localhost
  user: process.env.DB_USER,         // root
  password: process.env.DB_PASSWORD, // empty in XAMPP
  database: process.env.DB_NAME,     // autoconnection
  dateStrings: true                  // dates come back as '2026-10-24'
});

module.exports = db;