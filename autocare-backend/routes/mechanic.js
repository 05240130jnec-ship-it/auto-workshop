// routes/mechanic.js — URLs under /api/mechanic. The work is done in controllers/mechanicController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const mechanic = require('../controllers/mechanicController');

const router = express.Router();
router.use(requireAuth, requireRole('mechanic'));   // only mechanics

// My jobs  (?status=progress works on the list)
router.get('/repairs', mechanic.myRepairs);
router.get('/repairs/:id', mechanic.getRepair);
router.patch('/repairs/:id', mechanic.updateRepair);          // start / finish / add a note

// Parts and services used on a job
router.get('/parts', mechanic.parts);
router.post('/repairs/:id/parts', mechanic.addPart);                      // stock goes down
router.delete('/repairs/:id/parts/:rowId', mechanic.removePart);          // stock goes back
router.post('/repairs/:id/services', mechanic.addService);
router.delete('/repairs/:id/services/:rowId', mechanic.removeService);

// Reports and my profile
router.get('/reports', mechanic.reports);
router.get('/profile', mechanic.getProfile);
router.patch('/profile', mechanic.updateProfile);
router.patch('/profile/password', mechanic.changePassword);

module.exports = router;
