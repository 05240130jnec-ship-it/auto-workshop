// Run once:  node import-tables.js
// Creates all the tables in the database from database.sql
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { config } = require('./db');

(async () => {
  const conn = await mysql.createConnection({ ...config, multipleStatements: true });
  const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
  await conn.query(sql);
  console.log('Tables created');
  await conn.end();
})().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});