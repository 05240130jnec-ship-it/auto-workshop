// controllers/profileController.js — "My profile" for customers (website → person icon → My profile).
// Everything is saved in MySQL, also the profile photo (column customers.photo).

const bcrypt = require('bcrypt');
const Customer = require('../models/customerModel');

const NAME = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const PHONE = /^(\+?975)?[1-8]\d{7}$/;                    // Bhutan: 8 digits
const PHOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO = 400 * 1024;                              // the website makes it small (about 30–60 KB)

// GET /api/profile  -> my details
async function getProfile(req, res) {
  const row = await Customer.findProfile(req.user.id);
  if (!row) return res.status(404).json({ error: 'Account not found.' });
  res.json(row);
}

// PATCH /api/profile  { name, phone, address }  (the email is the login, so it stays)
async function updateProfile(req, res) {
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  const phone = String(req.body.phone || '').replace(/[\s-]/g, '');
  const address = String(req.body.address || '').trim();
  if (!NAME.test(name)) return res.status(400).json({ error: 'Please enter your full name (letters and spaces only).' });
  if (phone && !PHONE.test(phone)) return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  if (address.length > 200) return res.status(400).json({ error: 'The address is too long.' });
  await Customer.updateDetails(req.user.id, { name, phone: phone || null, address: address || null });
  res.json(await Customer.findProfile(req.user.id));
}

// PUT /api/profile/photo  { photo }  (a small picture as text: "data:image/jpeg;base64,...")
async function savePhoto(req, res) {
  const photo = String(req.body.photo || '');
  if (!PHOTO.test(photo)) return res.status(400).json({ error: 'Please choose a JPG, PNG or WEBP picture.' });
  if (photo.length > MAX_PHOTO) return res.status(400).json({ error: 'This picture is too big. Please choose a smaller one.' });
  await Customer.setPhoto(req.user.id, photo);
  res.json(await Customer.findProfile(req.user.id));
}

// DELETE /api/profile/photo
async function removePhoto(req, res) {
  await Customer.setPhoto(req.user.id, null);
  res.json(await Customer.findProfile(req.user.id));
}

// PATCH /api/profile/password  { current, next }
async function changePassword(req, res) {
  const current = String(req.body.current || '');
  const next = String(req.body.next || '');
  const hash = await Customer.getPasswordHash(req.user.id);
  if (!hash || !(await bcrypt.compare(current, hash))) {
    return res.status(400).json({ error: 'Your current password is not correct.' });
  }
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
    return res.status(400).json({ error: 'New password needs at least 8 characters with a letter and a number.' });
  }
  await Customer.setPassword(req.user.id, await bcrypt.hash(next, 10));
  res.json({ ok: true });
}

module.exports = { getProfile, updateProfile, savePhoto, removePhoto, changePassword };
