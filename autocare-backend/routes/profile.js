// routes/profile.js — URLs under /api/profile ("My profile" for customers).
// The work is done in controllers/profileController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const profile = require('../controllers/profileController');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only a logged-in customer

router.get('/', profile.getProfile);                 // my details + photo
router.patch('/', profile.updateProfile);            // { name, phone, address }
router.put('/photo', profile.savePhoto);             // { photo: "data:image/jpeg;base64,..." }
router.delete('/photo', profile.removePhoto);
router.patch('/password', profile.changePassword);   // { current, next }

module.exports = router;
