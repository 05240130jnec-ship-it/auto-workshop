// Connection to MySQL, shared by the whole backend.
// A "pool" keeps a few connections open and reuses them for each request.
require('dotenv').config({ quiet: true })
const mysql = require('mysql2/promise')

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autocare',
  dateStrings: true, // give dates back as "2026-10-19" instead of JavaScript Date objects
  connectionLimit: 10,
})

// Run several queries as ONE transaction: either all of them are saved, or none.
// Example: receiving an order must add stock AND mark the order received together.
//   await db.transaction(async (conn) => { await conn.query(...); await conn.query(...) })
db.transaction = async (work) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const result = await work(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = db
