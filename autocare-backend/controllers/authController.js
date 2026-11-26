// controllers/authController.js — login, signup, Google login, forgot password and "who am I".
// The SQL is in the models; this file decides what to do and what to answer.

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Customer = require('../models/customerModel');
const LoginAttempt = require('../models/loginAttemptModel');
const PasswordReset = require('../models/passwordResetModel');
const { getSettings } = require('../models/settingsModel');
const { sendMail } = require('../utils/mailer');

const { waitText } = LoginAttempt;

// Make a token that lasts 1 day
function makeToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// POST /api/auth/login   body: { email, password }
async function login(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  if (!email || !password) return res.status(400).json({ error: 'Please enter your email and password.' });

  // 1. Locked? Then we do not even check the password.
  await LoginAttempt.setupTable();
  const locked = await LoginAttempt.secondsLocked(email);
  if (locked) {
    return res.status(429).json({ error: `Too many wrong attempts. Try again in ${waitText(locked)}.`, wait: locked });
  }

  // 2. Check the email and password
  const acc = await User.findByEmail(email);
  if (!acc || !(await bcrypt.compare(password, acc.password))) {
    // each new lock is longer: 15 s, 30 s, 1 min, 2 min ... (see loginAttemptModel.js)
    const { left, lock } = await LoginAttempt.countWrongTry(email);
    if (left === 0) {
      return res.status(429).json({ error: `Too many wrong attempts. Try again in ${waitText(lock)}.`, wait: lock });
    }
    if (left <= 2) {
      return res.status(401).json({ error: `Wrong email or password. ${left} ${left > 1 ? 'tries' : 'try'} left before the account is locked for ${waitText(lock)}.` });
    }
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  // 3. Right password: clear the wrong tries
  await LoginAttempt.clear(email);

  if (acc.role === 'customer' && acc.status === 'inactive') {
    return res.status(403).json({ error: 'This account is inactive. Please contact the workshop.' });
  }

  // Two separate login pages: /login is only for customers, /staff-login only for mechanics and the admin.
  // The page sends portal: 'customer' or 'staff'; the wrong page gets no token.
  const portal = req.body.portal;
  if (portal === 'customer' && acc.role !== 'customer') {
    return res.status(403).json({ error: 'This login is for customers. Workshop staff (mechanics and admin), please use the staff login.', staff: true });
  }
  if (portal === 'staff' && acc.role === 'customer') {
    return res.status(403).json({ error: 'This login is only for workshop staff. Customers, please use the customer login.', customer: true });
  }

  const user = { id: acc.id, role: acc.role, name: acc.name, email: acc.email };
  res.json({ token: makeToken(user), user });
}

// POST /api/auth/signup   body: { name, email, phone, address, password }
async function signup(req, res) {
  const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').replace(/[\s-]/g, '');
  const address = String(req.body.address || '').trim();
  const password = String(req.body.password || '');
  // The website checks these too, but someone could skip the website
  if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) return res.status(400).json({ error: 'Please enter your full name (letters and spaces only).' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!/^(\+?975)?[1-8]\d{7}$/.test(phone)) return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password needs at least 8 characters with a letter and a number.' });
  }
  if (await User.findByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' });

  const id = await Customer.nextId();
  const hash = await bcrypt.hash(password, 10);
  await Customer.create({ id, name, email, phone: phone || null, address: address || null, password: hash, status: 'active' });

  const user = { id, role: 'customer', name, email };
  res.status(201).json({ token: makeToken(user), user });
}

// ---------- Continue with Google ----------
// The website shows Google's button. When the person picks their Google account, Google gives
// the website a token. We ask Google if that token is real and meant for OUR app
// (GOOGLE_CLIENT_ID in .env), then log the person in with the email inside it.
// A new email becomes a new customer account automatically.

// GET /api/auth/google-config — the website asks if Google login is set up
function googleConfig(req, res) {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
}

// POST /api/auth/google   body: { accessToken }  (our Google button)  or  { credential }  (Google's own button)
async function google(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Google login is not set up yet (GOOGLE_CLIENT_ID is missing in .env).' });
  const credential = String(req.body.credential || '');
  const accessToken = String(req.body.accessToken || '');
  if (!credential && !accessToken) return res.status(400).json({ error: 'Google did not send a login. Please try again.' });

  // 1. Ask Google: is this token real? (and get the name + email)
  let info;
  try {
    const url = accessToken
      ? 'https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(accessToken)
      : 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential);
    const r = await fetch(url);
    info = await r.json();
    if (!r.ok) throw new Error(info.error_description || 'invalid token');
    if (accessToken) {
      // the access token does not contain the name, so ask Google for it
      const u = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + accessToken } });
      if (u.ok) { const me = await u.json(); info.name = me.name; info.email = info.email || me.email; }
    }
  } catch (err) {
    return res.status(401).json({ error: 'Google login failed. Please try again.' });
  }
  // 2. Was it made for our website, and is the email confirmed by Google?
  if (info.aud !== clientId && info.azp !== clientId) return res.status(401).json({ error: 'This Google login is not for AutoCare Pro.' });
  if (info.email_verified !== 'true' && info.email_verified !== true) {
    return res.status(401).json({ error: 'Your Google email is not verified.' });
  }
  const email = String(info.email || '').toLowerCase();
  const name = info.name || email.split('@')[0];

  // 3. Find the account, or make a new customer
  let acc = await User.findByEmail(email);
  if (!acc) {
    const id = await Customer.nextId();
    // They log in with Google, so we save a random password nobody knows (the column cannot be empty)
    const randomHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
    await Customer.create({ id, name, email, phone: null, address: null, password: randomHash, status: 'active' });
    acc = { id, name, email, role: 'customer', status: 'active' };
  }
  if (acc.role === 'customer' && acc.status === 'inactive') {
    return res.status(403).json({ error: 'This account is inactive. Please contact the workshop.' });
  }
  await LoginAttempt.clear(email).catch(() => {});
  // "Continue with Google" is only on the customer login: staff must use the staff login
  if (acc.role !== 'customer') {
    return res.status(403).json({ error: 'This login is for customers. Workshop staff (mechanics and admin), please use the staff login.', staff: true });
  }

  const user = { id: acc.id, role: acc.role, name: acc.name, email: acc.email };
  res.json({ token: makeToken(user), user });
}

// ---------- Forgot password: a 6-digit code by email ----------
// 1. POST /api/auth/forgot  { email }                    -> emails a 6-digit code (valid 10 minutes)
// 2. POST /api/auth/reset   { email, code, password }    -> sets the new password
// The answer of step 1 is the same whether the email exists or not, so nobody can use this
// page to find out who has an account.
const CODE_MINUTES = 10;      // how long a code works
const CODE_TRIES = 5;         // wrong codes allowed before the code stops working
const RESEND_SECONDS = 60;    // wait between two codes for the same email

// "Hello {name}, your code is {code}" -> the real name and code
const fill = (text, values) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));

async function forgot(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  await PasswordReset.setupTable();

  // Same email asked less than 60 seconds ago? Ask them to wait.
  const wait = await PasswordReset.secondsToWait(email, RESEND_SECONDS);
  if (wait) {
    return res.status(429).json({ error: `Please wait ${wait} seconds before asking for a new code.`, wait });
  }

  const acc = await User.findByEmail(email);
  if (acc && !(acc.role === 'customer' && acc.status === 'inactive')) {
    const code = String(Math.floor(100000 + Math.random() * 900000));   // 6 digits
    await PasswordReset.save(email, await bcrypt.hash(code, 10), CODE_MINUTES);

    // The email text comes from MySQL (admin -> Website Content -> Login & profile)
    const s = await getSettings();
    const values = { name: acc.name.split(' ')[0], code, minutes: CODE_MINUTES };
    const text = fill(s.resetEmailText || 'Hello {name},\n\nYour AutoCare Pro password reset code is: {code}\n\nIt works for {minutes} minutes.', values);
    try {
      await sendMail({
        to: email,
        subject: fill(s.resetEmailSubject || 'Your password reset code', values),
        text,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2933">${text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(code, `<b style="font-size:26px;letter-spacing:6px;color:#f57c00">${code}</b>`)
          .replace(/\n/g, '<br>')}</div>`,
      });
    } catch (err) {
      console.error('Could not send the reset email:', err.message);
      await PasswordReset.remove(email);
      return res.status(500).json({ error: 'We could not send the email right now. Please try again later.' });
    }
  }
  res.json({ ok: true, minutes: CODE_MINUTES });
}

async function reset(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const password = String(req.body.password || '');
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Please enter the 6-digit code from the email.' });
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Password needs at least 8 characters with a letter and a number.' });
  }
  await PasswordReset.setupTable();

  const row = await PasswordReset.find(email);
  if (!row || !Number(row.valid) || row.tries >= CODE_TRIES) {
    return res.status(400).json({ error: 'This code has expired. Please ask for a new code.' });
  }
  if (!(await bcrypt.compare(code, row.codeHash))) {
    await PasswordReset.addTry(email);
    const left = CODE_TRIES - row.tries - 1;
    return res.status(400).json({ error: left > 0 ? `Wrong code. ${left} ${left > 1 ? 'tries' : 'try'} left.` : 'Wrong code. Please ask for a new code.' });
  }

  const acc = await User.findByEmail(email);
  if (!acc) return res.status(400).json({ error: 'This code has expired. Please ask for a new code.' });
  await User.setPassword(acc.role, acc.id, await bcrypt.hash(password, 10));
  await PasswordReset.remove(email);
  await LoginAttempt.setupTable();
  await LoginAttempt.clear(email);   // unlock the login too
  res.json({ ok: true });
}

// GET /api/auth/me   (needs a token) — "is my login still valid?"
function me(req, res) {
  const { id, role, name, email } = req.user;
  res.json({ user: { id, role, name, email } });
}

module.exports = { login, signup, googleConfig, google, forgot, reset, me };
