// Small helpers shared by the route files
const db = require('./db')

// Next ID like C-009, P-115, PO-2217: prefix + (highest number + 1)
async function nextId(table, prefix, width = 3, conn = db) {
  const [[row]] = await conn.query(
    `SELECT MAX(CAST(SUBSTRING(id, ?) AS UNSIGNED)) AS maxNum FROM ${table} WHERE id LIKE ?`,
    [prefix.length + 1, prefix + '%']
  )
  return prefix + String((row.maxNum || 0) + 1).padStart(width, '0')
}

// Is this email already used by any account (admin, mechanic or customer)?
// except = { table, id } lets a user keep their own email when editing.
async function emailTaken(email, except = null) {
  for (const table of ['admins', 'mechanics', 'customers']) {
    const [rows] = await db.query(`SELECT id FROM ${table} WHERE email = ?`, [email])
    if (rows.some((r) => !(except && except.table === table && except.id === r.id))) return true
  }
  return false
}

// Only keep the allowed keys from req.body, e.g. pick(req.body, ['name', 'phone'])
function pick(body, keys) {
  const out = {}
  for (const k of keys) if (body && body[k] !== undefined) out[k] = body[k]
  return out
}

// Build "UPDATE table SET a = ?, b = ? WHERE id = ?" from an object
async function updateRow(table, id, fields, conn = db) {
  const keys = Object.keys(fields)
  if (!keys.length) return 0
  const [result] = await conn.query(
    `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => fields[k]), id]
  )
  return result.affectedRows
}

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))

module.exports = { nextId, emailTaken, pick, updateRow, isEmail }
