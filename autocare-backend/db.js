require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Settings come from .env, so the same code works with XAMPP or Aiven
const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  // Aiven only accepts secure (SSL) connections, checked with its certificate
  ssl: process.env.DB_SSL === 'true'
    ? { ca: fs.readFileSync(path.join(__dirname, 'ca.pem')) }
    : undefined,
};

const db = mysql.createPool(config);

module.exports = db;
module.exports.config = config;