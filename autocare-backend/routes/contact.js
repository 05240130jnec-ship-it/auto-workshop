// routes/contact.js — the contact form on the Contact page.
//
// Anyone can send a message (no login needed):
//   POST   /api/contact                    { name, email, phone, subject, message }
//
// Only the admin can read and manage the messages (admin → Messages):
//   GET    /api/contact/admin              -> all messages, newest first
//   GET    /api/contact/admin/unread       -> { count } of new messages (sidebar badge)
//   PATCH  /api/contact/admin/:id          { status: 'new' | 'read' | 'replied' }
//   DELETE /api/contact/admin/:id
//
// The messages are saved in the MySQL table contact_messages
// (the backend creates it by itself when it starts, see settings.js → upgradeDatabase).

const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getSettings } = require('../settings');

const router = express.Router();
const adminOnly = [requireAuth, requireRole('admin')];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Bhutan phone: 8 digits starting with 1–8, with or without +975 in front, e.g. 17123456 or +975 17123456
const PHONE = /^(\+?975)?[1-8]\d{7}$/;
const toLines = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);

// ---------- PUBLIC: send a message ----------
router.post('/', async (req, res) => {
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').replace(/[\s-]/g, '');
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  // Check every field (the website checks too, but someone could skip it)
  if (name.length < 2 || name.length > 80 || !/[A-Za-z]/.test(name)) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  if (!EMAIL.test(email) || email.length > 120) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (phone && !PHONE.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  }
  const subjects = toLines((await getSettings()).contactSubjects);
  if (!subjects.includes(subject)) {
    return res.status(400).json({ error: 'Please choose a subject from the list.' });
  }
  if (message.length < 10) return res.status(400).json({ error: 'Please write a little more (at least 10 characters).' });
  if (message.length > 2000) return res.status(400).json({ error: 'Your message is too long (2000 characters at most).' });

  // Stop spam: at most 5 messages per email address per hour
  const [recent] = await db.query(
    'SELECT COUNT(*) AS n FROM contact_messages WHERE email = ? AND createdAt > NOW() - INTERVAL 1 HOUR', [email]);
  if (Number(recent[0].n) >= 5) {
    return res.status(429).json({ error: 'You have sent several messages already. Please wait a while or call us.' });
  }

  const [r] = await db.query(
    'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone || null, subject, message]);
  res.status(201).json({ id: r.insertId, message: 'Thank you! We will get back to you soon.' });
});

// ---------- ADMIN ----------
router.get('/admin', ...adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY createdAt DESC, id DESC');
  res.json(rows);
});

router.get('/admin/unread', ...adminOnly, async (req, res) => {
  const [rows] = await db.query("SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'new'");
  res.json({ count: Number(rows[0].n) });
});

router.patch('/admin/:id', ...adminOnly, async (req, res) => {
  const status = req.body.status;
  if (!['new', 'read', 'replied'].includes(status)) return res.status(400).json({ error: 'Unknown status.' });
  const [r] = await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Message not found.' });
  const [rows] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/admin/:id', ...adminOnly, async (req, res) => {
  const [r] = await db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Message not found.' });
  res.json({ ok: true });
});

module.exports = router;
