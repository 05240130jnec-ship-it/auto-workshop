// routes/profile.js — "My profile" for customers (website → person icon → My profile).
// Everything is saved in MySQL, also the profile photo (column customers.photo).
//
//   GET    /api/profile            -> my details + photo
//   PATCH  /api/profile            { name, phone, address }
//   PUT    /api/profile/photo      { photo }  (a small picture as text: "data:image/jpeg;base64,...")
//   DELETE /api/profile/photo
//   PATCH  /api/profile/password   { current, next }

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only a logged-in customer

const FIELDS = 'id, name, email, phone, address, photo, joined';
const NAME = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const PHONE = /^(\+?975)?[1-8]\d{7}$/;                    // Bhutan: 8 digits
const PHOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO = 400 * 1024;                              // the website makes it small (about 30–60 KB)

async function me(id) {
  const [rows] = await db.query(`SELECT ${FIELDS} FROM customers WHERE id = ?`, [id]);
  return rows[0];
}

// My details
router.get('/', async (req, res) => {
  const row = await me(req.user.id);
  if (!row) return res.status(404).json({ error: 'Account not found.' });
  res.json(row);
});

// Change name, phone, address (the email is the login, so it stays)
router.patch('/', async (req, res) => {
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  const phone = String(req.body.phone || '').replace(/[\s-]/g, '');
  const address = String(req.body.address || '').trim();
  if (!NAME.test(name)) return res.status(400).json({ error: 'Please enter your full name (letters and spaces only).' });
  if (!PHONE.test(phone)) return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  if (address.length > 200) return res.status(400).json({ error: 'The address is too long.' });
  await db.query('UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address || null, req.user.id]);
  res.json(await me(req.user.id));
});

// Save a new profile photo (stored in MySQL as text)
router.put('/photo', async (req, res) => {
  const photo = String(req.body.photo || '');
  if (!PHOTO.test(photo)) return res.status(400).json({ error: 'Please choose a JPG, PNG or WEBP picture.' });
  if (photo.length > MAX_PHOTO) return res.status(400).json({ error: 'This picture is too big. Please choose a smaller one.' });
  await db.query('UPDATE customers SET photo = ? WHERE id = ?', [photo, req.user.id]);
  res.json(await me(req.user.id));
});

// Remove the photo
router.delete('/photo', async (req, res) => {
  await db.query('UPDATE customers SET photo = NULL WHERE id = ?', [req.user.id]);
  res.json(await me(req.user.id));
});

// Change the password (needs the current one)
router.patch('/password', async (req, res) => {
  const current = String(req.body.current || '');
  const next = String(req.body.next || '');
  const [rows] = await db.query('SELECT password FROM customers WHERE id = ?', [req.user.id]);
  if (!rows.length || !(await bcrypt.compare(current, rows[0].password))) {
    return res.status(400).json({ error: 'Your current password is not correct.' });
  }
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
    return res.status(400).json({ error: 'New password needs at least 8 characters with a letter and a number.' });
  }
  await db.query('UPDATE customers SET password = ? WHERE id = ?', [await bcrypt.hash(next, 10), req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
