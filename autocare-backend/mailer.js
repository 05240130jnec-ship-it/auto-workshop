// mailer.js — sends emails from the workshop's Gmail (used for "Forgot password").
//
// Set these 2 lines in .env (see .env.example):
//   EMAIL_USER=yourworkshop@gmail.com
//   EMAIL_PASS=abcd efgh ijkl mnop      ← a Gmail "App Password", NOT your normal password
//
// If they are empty, nothing is sent: the email is printed in the backend terminal instead,
// so you can still test the page on your own computer.

const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS.replace(/\s/g, '') },
    });
  }
  return transporter;
}

// sendMail({ to, subject, text, html })
async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.log('\n----- EMAIL (not sent: EMAIL_USER / EMAIL_PASS are empty in .env) -----');
    console.log('To:      ' + to);
    console.log('Subject: ' + subject);
    console.log(text);
    console.log('-----------------------------------------------------------------------\n');
    return;
  }
  await t.sendMail({ from: `"AutoCare Pro" <${process.env.EMAIL_USER}>`, to, subject, text, html });
}

module.exports = { sendMail };
