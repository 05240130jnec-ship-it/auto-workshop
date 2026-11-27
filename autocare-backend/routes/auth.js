// routes/auth.js — URLs under /api/auth. The work is done in controllers/authController.js
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/login', auth.login);              // { email, password }
router.post('/signup', auth.signup);            // { name, email, phone, address, password } -> emails "Is it you?"
router.post('/verify-email', auth.verifyEmail); // { token, answer: 'yes' | 'no' }  (buttons in that email)
router.get('/google-config', auth.googleConfig); // is Google login set up?
router.post('/google', auth.google);            // { accessToken } or { credential }
router.post('/forgot', auth.forgot);            // { email } -> emails a 6-digit code
router.post('/reset', auth.reset);              // { email, code, password }
router.get('/me', requireAuth, auth.me);        // "is my login still valid?"

module.exports = router;
