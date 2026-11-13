// test-email.js — checks that the Gmail settings in .env work.
// Run in the autocare-backend folder:   node test-email.js
// It sends one test email to EMAIL_USER (yourself) and prints exactly what went wrong if it fails.
require('dotenv').config();
const nodemailer = require('nodemailer');

const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
console.log('EMAIL_USER =', user || '(empty)');
console.log('EMAIL_PASS =', pass ? pass.length + ' letters' : '(empty)');
if (!user || !pass) { console.log('\n❌ One of the two lines is empty in .env'); process.exit(1); }

const t = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });

(async () => {
  try {
    console.log('\n1) Connecting to Gmail and logging in…');
    await t.verify();
    console.log('   ✅ Login OK');
    console.log('2) Sending a test email to ' + user + ' …');
    await t.sendMail({ from: `"AutoCare Pro" <${user}>`, to: user, subject: 'AutoCare Pro test email', text: 'If you can read this, the email works!' });
    console.log('   ✅ Sent! Check your Gmail inbox (and Spam).');
  } catch (err) {
    console.log('\n❌ FAILED:', err.message);
    console.log('   code:', err.code, '| response:', err.responseCode || '-');
    if (err.code === 'EAUTH') console.log('\n👉 Gmail refused the login: make a NEW App Password at myaccount.google.com/apppasswords (2-Step Verification must be on) with the SAME Gmail as EMAIL_USER.');
    else if (['ETIMEDOUT', 'ECONNREFUSED', 'ESOCKET', 'ECONNECTION', 'EDNS'].includes(err.code)) console.log('\n👉 Could not reach Gmail: this Wi-Fi probably blocks email. Try your phone hotspot.');
  }
})();
