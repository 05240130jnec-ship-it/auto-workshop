// Creates the "autocare" database, all tables, and fills them with sample data.
//   Run with:  npm run setup-db
// You can run it again any time to reset the data back to the samples.
require('dotenv').config({ quiet: true })
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const { buildSeed } = require('./seed')

const DB_NAME = process.env.DB_NAME || 'autocare'

// "n days ago" as YYYY-MM-DD (negative n = in the future)
function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // needed to run schema.sql in one go
  })

  console.log('Connected to MySQL ✔')
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.query(`USE \`${DB_NAME}\``)

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await conn.query(schema)
  console.log('Tables created ✔')

  const d = buildSeed(daysAgo)
  const hash = (pw) => bcrypt.hashSync(pw, 10) // passwords are stored scrambled, never as plain text

  // Insert many rows at once:  INSERT INTO table (cols) VALUES (...), (...), ...
  async function insert(table, rows) {
    if (!rows.length) return
    const cols = Object.keys(rows[0])
    await conn.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES ?`, [rows.map((r) => cols.map((c) => r[c]))])
    console.log(`  ${table}: ${rows.length} rows`)
  }

  await insert('admins', [{ id: 'A-1', name: 'Admin User', email: 'admin@autocare.bt', password_hash: hash('admin123') }])

  await insert('customers', d.customers.map((c) => ({
    id: c.id, name: c.name, email: c.email, password_hash: hash(c.password), phone: c.phone,
    address: c.address, status: c.status, joined: c.joined,
  })))

  await insert('mechanics', d.mechanics.map((m) => ({
    id: m.id, name: m.name, email: m.email, password_hash: hash(m.password), phone: m.phone,
    specialization: m.specialization, experience: m.experience, status: m.status,
    photo: m.photo || null, joined: m.joined,
  })))

  await insert('suppliers', d.suppliers.map((s) => ({
    id: s.id, name: s.name, person: s.person, phone: s.phone, email: s.email, address: s.address,
  })))

  await insert('inventory', d.inventory.map((p) => ({
    id: p.id, sku: p.sku, name: p.name, category: p.category, stock: p.stock,
    reorder_level: p.reorder, price: p.price, supplier_id: p.supplierId,
  })))

  await insert('repairs', d.repairs.map((r) => ({
    id: r.id, customer_id: r.customerId, mechanic_id: r.mechanicId, vehicle: r.vehicle, plate: r.plate,
    service: r.service, status: r.status, priority: r.priority, booked_on: r.date, due: r.due,
    completed_on: r.status === 'complete' ? r.due : null, cost: r.cost, notes: r.notes || null,
  })))

  await insert('repair_parts', d.repairs.flatMap((r) => (r.parts || []).map((p) => ({
    repair_id: r.id, part_id: p.partId, name: p.name, qty: p.qty, price: p.price, used_on: p.date,
  }))))

  await insert('repair_services', d.repairs.flatMap((r) => (r.services || []).map((s) => ({
    repair_id: r.id, name: s.name, qty: s.qty, cost: s.cost,
  }))))

  await insert('purchase_orders', d.orders.map((o) => ({
    id: o.id, part_id: o.partId, supplier_id: o.supplierId, requested_by: o.requestedBy,
    qty: o.qty, status: o.status, order_date: o.date, note: o.note || null,
  })))

  await conn.end()
  console.log(`\nDone! Database "${DB_NAME}" is ready. Open http://localhost/phpmyadmin to look at it.`)
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message)
  if (err.code === 'ECONNREFUSED') console.error('   → Is MySQL running? Open the XAMPP Control Panel and click Start next to MySQL.')
  if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('   → Wrong DB_USER / DB_PASSWORD in the .env file.')
  process.exit(1)
})
