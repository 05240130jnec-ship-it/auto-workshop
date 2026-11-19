// routes/repairs.js — URLs under /api/repairs (a customer's own repairs).
// The work is done in controllers/repairController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const repairs = require('../controllers/repairController');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only logged-in customers

router.get('/', repairs.myRepairs);           // my repairs
router.get('/slots', repairs.slots);          // ?date=2026-10-28 -> how full each time slot is
router.get('/:id', repairs.getOne);           // one repair with parts and services
router.post('/', repairs.book);               // book a new repair
router.patch('/:id', repairs.cancel);         // { status: 'cancelled' } (only while pending)

module.exports = router;
