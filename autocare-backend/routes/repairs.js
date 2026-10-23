// Repair jobs — every route needs a login token.
//
// Who can do what:
//   customer → see and book their OWN repairs, cancel their own pending booking
//   mechanic → see repairs assigned to THEM, change their status
//   admin    → everything
const express = require('express')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth) // all routes below need a valid token

const SELECT_REPAIR = `
  SELECT r.*, c.name AS customer_name, c.phone AS customer_phone, m.name AS mechanic_name
    FROM repairs r
    JOIN customers c ON c.id = r.customer_id
    LEFT JOIN mechanics m ON m.id = r.mechanic_id`

// Can this user look at this repair?
function canSee(user, repair) {
  if (user.role === 'admin') return true
  if (user.role === 'customer') return repair.customer_id === user.id
  if (user.role === 'mechanic') return repair.mechanic_id === user.id
  return false
}

// GET /api/repairs   (admin may filter: ?status=pending&mechanic=M-001&customer=C-001)
router.get('/', async (req, res) => {
  const where = []
  const params = []

  // Customers and mechanics only ever get their own jobs — no matter what they ask for
  if (req.user.role === 'customer') { where.push('r.customer_id = ?'); params.push(req.user.id) }
  if (req.user.role === 'mechanic') { where.push('r.mechanic_id = ?'); params.push(req.user.id) }
  if (req.user.role === 'admin') {
    if (req.query.mechanic) { where.push('r.mechanic_id = ?'); params.push(req.query.mechanic) }
    if (req.query.customer) { where.push('r.customer_id = ?'); params.push(req.query.customer) }
  }
  if (req.query.status) { where.push('r.status = ?'); params.push(req.query.status) }

  const [rows] = await db.query(
    `${SELECT_REPAIR} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.booked_on DESC, r.id DESC`,
    params
  )
  res.json(rows)
})

// GET /api/repairs/slots?date=2026-10-25  — how many bookings each time slot already has
// (no private details, so any logged-in user can ask; used by the Booking page)
router.get('/slots', async (req, res) => {
  const date = String(req.query.date || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'date must look like 2026-10-25' })
  const [rows] = await db.query(
    "SELECT appt_time, COUNT(*) AS n FROM repairs WHERE appt_date = ? AND status <> 'cancelled' GROUP BY appt_time", [date])
  const counts = {}
  rows.forEach((r) => { if (r.appt_time) counts[r.appt_time] = r.n })
  res.json(counts)
})

// GET /api/repairs/ACP-9247  — one repair with its parts, services and notes
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(`${SELECT_REPAIR} WHERE r.id = ?`, [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Repair not found' })
  if (!canSee(req.user, rows[0])) return res.status(403).json({ error: 'This repair is not yours' })

  const [parts] = await db.query('SELECT * FROM repair_parts WHERE repair_id = ?', [req.params.id])
  const [services] = await db.query('SELECT * FROM repair_services WHERE repair_id = ?', [req.params.id])
  const [notes] = await db.query('SELECT * FROM work_notes WHERE repair_id = ? ORDER BY created_at', [req.params.id])
  res.json({ ...rows[0], parts, services, notes })
})

// POST /api/repairs  — new booking
//   customer: { vehicle, plate, service, due, notes?, appt_date?, appt_time?, delivery?, cost? }
//   admin:    same + customer_id (+ mechanic_id, priority)
router.post('/', requireRole('customer', 'admin'), async (req, res) => {
  const b = req.body || {}
  const customer_id = req.user.role === 'customer' ? req.user.id : b.customer_id
  if (!customer_id || !b.vehicle || !b.plate || !b.service || !b.due) {
    return res.status(400).json({ error: 'vehicle, plate, service and due are required' + (req.user.role === 'admin' ? ' (and customer_id)' : '') })
  }
  const [cust] = await db.query('SELECT id FROM customers WHERE id = ?', [customer_id])
  if (!cust.length) return res.status(400).json({ error: 'Unknown customer_id' })

  // The workshop has 2 bays, so each time slot takes at most 2 bookings
  if (b.appt_date && b.appt_time) {
    const [[{ n }]] = await db.query(
      "SELECT COUNT(*) AS n FROM repairs WHERE appt_date = ? AND appt_time = ? AND status <> 'cancelled'", [b.appt_date, b.appt_time])
    if (n >= 2) return res.status(409).json({ error: 'That time slot is already full. Please choose another one.' })
  }

  const [[{ maxNum }]] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS maxNum FROM repairs')
  const id = 'ACP-' + ((maxNum || 9000) + 1)
  const mechanic_id = req.user.role === 'admin' ? b.mechanic_id || null : null

  await db.query(
    `INSERT INTO repairs (id, customer_id, mechanic_id, vehicle, plate, service, status, priority,
                          booked_on, due, cost, notes, appt_date, appt_time, delivery)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
    [id, customer_id, mechanic_id, b.vehicle, String(b.plate).toUpperCase(), b.service,
      mechanic_id ? 'progress' : 'pending', req.user.role === 'admin' && b.priority ? b.priority : 'normal',
      b.due, Number(b.cost) || 0, b.notes || null, b.appt_date || null, b.appt_time || null, b.delivery || null]
  )
  res.status(201).json({ id, status: mechanic_id ? 'progress' : 'pending' })
})

// PATCH /api/repairs/ACP-9248  — change status / mechanic / cost
router.patch('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM repairs WHERE id = ?', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Repair not found' })
  const repair = rows[0]
  if (!canSee(req.user, repair)) return res.status(403).json({ error: 'This repair is not yours' })

  const { status, mechanic_id, cost } = req.body || {}
  const role = req.user.role

  // Rules for non-admins
  if (role === 'customer') {
    if (status !== 'cancelled' || mechanic_id !== undefined || cost !== undefined) {
      return res.status(403).json({ error: 'Customers can only cancel a booking' })
    }
    if (repair.status !== 'pending') return res.status(400).json({ error: 'Only pending bookings can be cancelled' })
  }
  if (role === 'mechanic' && (mechanic_id !== undefined || status === 'cancelled')) {
    return res.status(403).json({ error: 'Mechanics can only change the status and final cost of their jobs' })
  }

  const sets = []
  const params = []
  if (status !== undefined) {
    if (!['pending', 'progress', 'complete', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'status must be pending, progress, complete or cancelled' })
    }
    sets.push('status = ?'); params.push(status)
    if (status === 'progress' && !repair.started_on) sets.push('started_on = CURDATE()')
    if (status === 'complete') sets.push('completed_on = CURDATE()')
  }
  if (mechanic_id !== undefined) { sets.push('mechanic_id = ?'); params.push(mechanic_id || null) }
  if (cost !== undefined) { sets.push('cost = ?'); params.push(Number(cost) || 0) }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })

  params.push(req.params.id)
  await db.query(`UPDATE repairs SET ${sets.join(', ')} WHERE id = ?`, params)
  res.json({ ok: true })
})

// ---------- Work on a repair: parts, services, notes ----------
// Only the assigned mechanic (or admin) can log work, and only while the job is open.
async function loadOpenRepair(req, res) {
  const [rows] = await db.query('SELECT * FROM repairs WHERE id = ?', [req.params.id])
  if (!rows.length) { res.status(404).json({ error: 'Repair not found' }); return null }
  const repair = rows[0]
  const allowed = req.user.role === 'admin' || (req.user.role === 'mechanic' && repair.mechanic_id === req.user.id)
  if (!allowed) { res.status(403).json({ error: 'Only the assigned mechanic can log work on this job' }); return null }
  if (repair.status === 'complete' || repair.status === 'cancelled') {
    res.status(400).json({ error: 'This job is already ' + repair.status }); return null
  }
  return repair
}

// POST /api/repairs/ACP-9247/parts   { part_id: "P-103", qty: 1 }
// Takes the parts OUT of inventory — both changes happen together (transaction).
router.post('/:id/parts', requireRole('mechanic', 'admin'), async (req, res) => {
  const repair = await loadOpenRepair(req, res)
  if (!repair) return
  const qty = Number(req.body?.qty)
  if (!req.body?.part_id || !Number.isInteger(qty) || qty < 1) return res.status(400).json({ error: 'part_id and a quantity of 1 or more are required' })

  const result = await db.transaction(async (conn) => {
    // FOR UPDATE locks the row so two mechanics can't take the last part at the same time
    const [parts] = await conn.query('SELECT * FROM inventory WHERE id = ? FOR UPDATE', [req.body.part_id])
    if (!parts.length) return { status: 400, error: 'Unknown part' }
    const part = parts[0]
    if (part.stock < qty) return { status: 400, error: `Only ${part.stock} × ${part.name} left in stock` }
    await conn.query('UPDATE inventory SET stock = stock - ? WHERE id = ?', [qty, part.id])
    const [ins] = await conn.query(
      'INSERT INTO repair_parts (repair_id, part_id, name, qty, price, used_on) VALUES (?, ?, ?, ?, ?, CURDATE())',
      [repair.id, part.id, part.name, qty, part.price])
    return { line_id: ins.insertId, stock_left: part.stock - qty, low: part.stock - qty <= part.reorder_level }
  })
  if (result.error) return res.status(result.status).json({ error: result.error })
  res.status(201).json(result)
})

// DELETE /api/repairs/ACP-9247/parts/5  — remove a part line and put the parts back in stock
router.delete('/:id/parts/:lineId', requireRole('mechanic', 'admin'), async (req, res) => {
  const repair = await loadOpenRepair(req, res)
  if (!repair) return
  const done = await db.transaction(async (conn) => {
    const [lines] = await conn.query('SELECT * FROM repair_parts WHERE id = ? AND repair_id = ?', [req.params.lineId, repair.id])
    if (!lines.length) return false
    if (lines[0].part_id) await conn.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [lines[0].qty, lines[0].part_id])
    await conn.query('DELETE FROM repair_parts WHERE id = ?', [lines[0].id])
    return true
  })
  if (!done) return res.status(404).json({ error: 'Part line not found' })
  res.status(204).end()
})

// POST /api/repairs/ACP-9247/services   { name: "Oil Change", qty: 1, cost: 700 }
router.post('/:id/services', requireRole('mechanic', 'admin'), async (req, res) => {
  const repair = await loadOpenRepair(req, res)
  if (!repair) return
  const { name } = req.body || {}
  const qty = Number(req.body?.qty) || 1
  const cost = Number(req.body?.cost)
  if (!name || !(cost >= 0)) return res.status(400).json({ error: 'name and cost are required' })
  const [ins] = await db.query('INSERT INTO repair_services (repair_id, name, qty, cost) VALUES (?, ?, ?, ?)', [repair.id, name, qty, cost])
  res.status(201).json({ line_id: ins.insertId })
})

// DELETE /api/repairs/ACP-9247/services/3
router.delete('/:id/services/:lineId', requireRole('mechanic', 'admin'), async (req, res) => {
  const repair = await loadOpenRepair(req, res)
  if (!repair) return
  const [result] = await db.query('DELETE FROM repair_services WHERE id = ? AND repair_id = ?', [req.params.lineId, repair.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Service line not found' })
  res.status(204).end()
})

// POST /api/repairs/ACP-9247/notes   { note: "Replaced spark plugs" }
router.post('/:id/notes', requireRole('mechanic', 'admin'), async (req, res) => {
  const repair = await loadOpenRepair(req, res)
  if (!repair) return
  if (!req.body?.note) return res.status(400).json({ error: 'note is required' })
  const [ins] = await db.query('INSERT INTO work_notes (repair_id, author, note) VALUES (?, ?, ?)', [repair.id, req.user.name, req.body.note])
  res.status(201).json({ id: ins.insertId })
})

// DELETE /api/repairs/ACP-9250  — admin only
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [result] = await db.query('DELETE FROM repairs WHERE id = ?', [req.params.id])
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair not found' })
  res.status(204).end()
})

module.exports = router
