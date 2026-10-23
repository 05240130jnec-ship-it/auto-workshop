// Mechanics
//   admin    → list, view, add, edit, remove, put on leave
//   mechanic → list the team, view and edit their OWN profile and availability
const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')
const { nextId, emailTaken, pick, updateRow, isEmail } = require('../utils')

const router = express.Router()
router.use(requireAuth)

const COLUMNS = 'm.id, m.name, m.email, m.phone, m.specialization, m.experience, m.status, m.photo, m.dob, m.address, m.joined'
const STATUSES = ['active', 'busy', 'leave']

// GET /api/mechanics  — with workload numbers
router.get('/', requireRole('admin', 'mechanic'), async (req, res) => {
  const [rows] = await db.query(`
    SELECT ${COLUMNS},
           COALESCE(SUM(r.status IN ('pending','progress')), 0) AS active_jobs,
           COALESCE(SUM(r.status = 'complete'), 0) AS completed_jobs,
           COALESCE(SUM(CASE WHEN r.status = 'complete' THEN r.cost END), 0) AS revenue
      FROM mechanics m
      LEFT JOIN repairs r ON r.mechanic_id = m.id
     GROUP BY m.id
     ORDER BY m.id`)
  res.json(rows.map((m) => ({ ...m, active_jobs: Number(m.active_jobs), completed_jobs: Number(m.completed_jobs), revenue: Number(m.revenue) })))
})

// GET /api/mechanics/M-001
router.get('/:id', requireRole('admin', 'mechanic'), async (req, res) => {
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM mechanics m WHERE m.id = ?`, [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Mechanic not found' })
  res.json(rows[0])
})

// POST /api/mechanics  — admin adds a mechanic
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {}
  const email = String(b.email || '').trim().toLowerCase()
  if (!b.name || !b.phone || !b.specialization || !isEmail(email)) {
    return res.status(400).json({ error: 'Name, phone, specialization and a valid email are required' })
  }
  if (await emailTaken(email)) return res.status(409).json({ error: 'That email is already used by another account' })

  const id = await nextId('mechanics', 'M-', 3)
  await db.query(
    `INSERT INTO mechanics (id, name, email, password_hash, phone, specialization, experience, status, joined)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, b.name.trim(), email, await bcrypt.hash(String(b.password || 'mech123'), 10), b.phone.trim(), b.specialization,
      Number(b.experience) || 0, STATUSES.includes(b.status) ? b.status : 'active', b.joined || new Date().toISOString().slice(0, 10)]
  )
  res.status(201).json({ id })
})

// PATCH /api/mechanics/M-001
//   admin may change everything; a mechanic only their own profile
//   Going on leave hands their open jobs back to "pending" so the admin can reassign them.
router.patch('/:id', async (req, res) => {
  const self = req.user.role === 'mechanic' && req.user.id === req.params.id
  if (req.user.role !== 'admin' && !self) return res.status(403).json({ error: 'You can only edit your own profile' })

  const fields = pick(req.body, ['name', 'email', 'phone', 'specialization', 'experience', 'status', 'dob', 'address', ...(req.user.role === 'admin' ? ['joined', 'photo'] : [])])
  if (fields.email !== undefined) {
    fields.email = String(fields.email).trim().toLowerCase()
    if (!isEmail(fields.email)) return res.status(400).json({ error: 'Invalid email' })
    if (await emailTaken(fields.email, { table: 'mechanics', id: req.params.id })) {
      return res.status(409).json({ error: 'That email is already used by another account' })
    }
  }
  if (fields.status !== undefined && !STATUSES.includes(fields.status)) return res.status(400).json({ error: 'status must be active, busy or leave' })
  if (fields.experience !== undefined) fields.experience = Number(fields.experience) || 0
  if (fields.dob === '') fields.dob = null
  if (!Object.keys(fields).length) return res.status(400).json({ error: 'Nothing to update' })

  const released = await db.transaction(async (conn) => {
    const changed = await updateRow('mechanics', req.params.id, fields, conn)
    if (!changed) return null
    if (fields.status === 'leave') {
      const [r] = await conn.query(
        `UPDATE repairs SET mechanic_id = NULL, status = 'pending'
          WHERE mechanic_id = ? AND status IN ('pending','progress')`, [req.params.id])
      return r.affectedRows
    }
    return 0
  })
  if (released === null) return res.status(404).json({ error: 'Mechanic not found' })
  res.json({ ok: true, jobs_returned_to_pending: released })
})

// DELETE /api/mechanics/M-001  — only if they have no open jobs (finished jobs keep their history)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const [[{ open }]] = await db.query(
    `SELECT COUNT(*) AS open FROM repairs WHERE mechanic_id = ? AND status IN ('pending','progress')`, [req.params.id])
  if (open > 0) return res.status(400).json({ error: `Reassign this mechanic's ${open} active job(s) first` })
  const [result] = await db.query('DELETE FROM mechanics WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Mechanic not found' })
  res.status(204).end()
})

module.exports = router
