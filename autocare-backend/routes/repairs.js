const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only logged-in customers

const TIME_SLOTS = ['08:00 AM', '09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '04:30 PM'];
const MAX_PER_SLOT = 2;

const SELECT_REPAIR = `
  SELECT r.*, m.name AS mechanicName
  FROM repairs r
  LEFT JOIN mechanics m ON m.id = r.mechanicId`;

async function addDetails(repair) {
  const [parts] = await db.query('SELECT * FROM repair_parts WHERE repairId = ?', [repair.id]);
  const [services] = await db.query('SELECT * FROM repair_services WHERE repairId = ?', [repair.id]);
  return { ...repair, parts, services };
}

// GET /api/repairs  -> my repairs
router.get('/', async (req, res) => {
  const [rows] = await db.query(SELECT_REPAIR + ' WHERE r.customerId = ? ORDER BY r.date DESC', [req.user.id]);
  res.json(rows);
});

// GET /api/repairs/slots?date=2026-10-28  -> how full each time slot is
router.get('/slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Please choose a date.' });

  const [rows] = await db.query(
    "SELECT apptTime, COUNT(*) AS booked FROM repairs WHERE apptDate = ? AND status <> 'cancelled' GROUP BY apptTime",
    [date]
  );
  const slots = TIME_SLOTS.map(time => {
    const found = rows.find(r => r.apptTime === time);
    const booked = found ? found.booked : 0;
    return { time, booked, full: booked >= MAX_PER_SLOT };
  });
  res.json(slots);
});

// GET /api/repairs/ACP-9247  -> one of my repairs, with parts and services
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(SELECT_REPAIR + ' WHERE r.id = ? AND r.customerId = ?', [req.params.id, req.user.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Repair not found.' });
  res.json(await addDetails(rows[0]));
});

// POST /api/repairs  -> book a new repair
router.post('/', async (req, res) => {
  const { vehicle, plate, service, notes, cost, apptDate, apptTime, delivery } = req.body;

  if (!vehicle || !plate || !service || !apptDate || !apptTime) {
    return res.status(400).json({ error: 'Please fill in vehicle, plate, service, date and time.' });
  }
  if (!TIME_SLOTS.includes(apptTime)) {
    return res.status(400).json({ error: 'Please pick a valid time slot.' });
  }

  const [count] = await db.query(
    "SELECT COUNT(*) AS booked FROM repairs WHERE apptDate = ? AND apptTime = ? AND status <> 'cancelled'",
    [apptDate, apptTime]
  );
  if (count[0].booked >= MAX_PER_SLOT) {
    return res.status(409).json({ error: 'That time slot is full. Please pick another.' });
  }

  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) AS last FROM repairs');
  const id = 'ACP-' + ((last[0].last || 9225) + 1);

  await db.query(
    `INSERT INTO repairs (id, customerId, vehicle, plate, service, status, priority, date, cost, notes, apptDate, apptTime, delivery)
     VALUES (?, ?, ?, ?, ?, 'pending', 'normal', CURDATE(), ?, ?, ?, ?, ?)`,
    [id, req.user.id, vehicle, plate, service, cost || 0, notes || '', apptDate, apptTime,
     delivery === 'pickup' ? 'pickup' : 'dropoff']
  );
  res.status(201).json({ id });
});

// PATCH /api/repairs/ACP-9251  -> cancel (only while pending)
router.patch('/:id', async (req, res) => {
  if (req.body.status !== 'cancelled') {
    return res.status(400).json({ error: 'You can only cancel a repair.' });
  }
  const [rows] = await db.query('SELECT status FROM repairs WHERE id = ? AND customerId = ?', [req.params.id, req.user.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Repair not found.' });
  if (rows[0].status !== 'pending') {
    return res.status(400).json({ error: 'Only pending repairs can be cancelled.' });
  }
  await db.query("UPDATE repairs SET status = 'cancelled' WHERE id = ?", [req.params.id]);
  res.json({ id: req.params.id, status: 'cancelled' });
});

module.exports = router;