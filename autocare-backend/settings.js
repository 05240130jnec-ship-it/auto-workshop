// settings.js — the website text and booking rules, saved in the MySQL table `settings`.
// The admin edits them in Website Content. These are only the STARTING values:
// content-setup.js puts them into the table once, after that MySQL is the only source.
//
// Lists are written one item per line. Some lines have parts separated by "|",
// e.g. hours:  "Saturday|8:00 AM – 6:00 PM".  In titles, *stars* mark the orange words.

const db = require('./db');

const DEFAULT_SETTINGS = {
  // ---------- Booking rules ----------
  timeSlots: '08:00 AM\n09:00 AM\n11:00 AM\n01:00 PM\n03:00 PM\n04:30 PM',
  maxPerSlot: '2',
  pickupFee: '500',

  // ---------- Contact details + footer ----------
  email: 'chungkuwangmo6@gmail.com',
  phone: '+975 17319436',
  whatsapp: '97517319436',
  address: 'Sarpang, Bhutan',
  addressNote: 'Located in the heart of the city. Drop by during business hours.',
  hours: 'Monday – Friday|8:00 AM – 6:00 PM\nSaturday|8:00 AM – 6:00 PM\nSunday|Closed',
  hoursNote: 'We aim to respond within 24 hours on business days. For urgent matters, reach us on WhatsApp.',
  contactIntro: 'We are here to help with any questions about our services, repairs, or parts. Reach out and we will respond promptly.',
  footerText: '© 2026 AutoCarePro. All rights reserved.',
  // Subjects in the contact form (one per line)
  contactSubjects: 'Booking question\nRepair status\nPrice / quote\nShop order\nFeedback\nOther',

  // ---------- Home page ----------
  homeTag: 'Auto workshop · Sarpang, Bhutan',
  homeTitle: 'Your Trusted *Auto Care* Partner',
  homeText: 'Expert service, genuine parts, and a commitment to get you back on the road safely.',
  homeImage: '/media/engine/engine1.jpg',
  homePoints: 'Certified technicians\nGenuine parts\nFree inspection',
  homeChip: 'Certified technicians|Genuine parts · Fair pricing',
  introTitle: 'Expert Care for Every Car',
  introText: 'From routine maintenance to complex engine overhauls, our certified technicians combine decades of hands-on experience with cutting-edge diagnostic technology.\n' +
    "We don't just fix cars – we build relationships. Our integrated inventory and supplier management ensures genuine parts, faster turnaround, and fair pricing.",
  introTicks: 'Certified technicians\nGenuine spare parts\nFast turnaround\nFair pricing',
  introImage: '/media/engine/engine2.jpg',

  // ---------- Login page + "Create an account" pop-up ----------
  loginButton: 'Log in',                      // the button in the navbar for visitors
  loginFormTitle: 'Welcome back',
  loginFormText: 'Sign in and we’ll take you to the right place.',
  signupTitle: 'Create your account',
  signupText: "It's free and only takes a minute",
  signupDoneTitle: 'Account created successfully!',
  signupDoneText: 'Welcome to AutoCare Pro, {name}. Your account is ready and you are signed in.',

  // ---------- Forgot password page + the email with the code ----------
  forgotTitle: 'Forgot your password?',
  forgotText: 'Enter the email of your account and we will send you a 6-digit code.',
  forgotCodeText: 'We sent a 6-digit code to {email}. Type it below with your new password.',
  forgotDoneTitle: 'Password changed!',
  forgotDoneText: 'Your new password is saved. You can sign in with it now.',
  resetEmailSubject: 'Your AutoCare Pro password reset code',
  resetEmailText: 'Hello {name},\n\nYour password reset code is: {code}\n\nIt works for {minutes} minutes. If you did not ask for this, you can ignore this email.\n\nAutoCare Pro',

  // ---------- My profile page (customers) ----------
  profileTitle: 'My *profile*',
  profileText: 'Keep your details up to date so the workshop can reach you about your repairs.',

  // ---------- About page ----------
  // Login page + "Create an account" pop-up
  loginTag: 'Trusted Toyota service',
  loginTitle: 'Your car, *in good hands.*',
  loginText: 'Sign in to book a service, follow your repair step by step and order genuine parts.',
  loginPoints: 'bi-calendar-check|Book a service in a few clicks\nbi-activity|See your repair status live\nbi-bag-check|Order parts and collect them at the workshop',
  loginFormTitle: 'Welcome back',
  loginFormText: 'Sign in and we’ll take you to the right place.',
  signupTitle: 'Create your account',
  signupText: "It's free and only takes a minute",
  signupDoneTitle: 'Account created successfully!',
  signupDoneText: 'Welcome to AutoCare Pro, {name}. Your account is ready and you are signed in.',
  // My profile page (customers)
  profileTitle: 'My *profile*',
  profileText: 'Keep your details up to date so the workshop can reach you about your repairs.',
  aboutTitle: 'About *AutoCarePro*',
  aboutText: 'Your trusted web-based auto workshop, where expert repairs meet genuine spare parts, all managed on one smart digital platform.',
  aboutImage: '/media/car%20wash/wash2.jpg',
  storyTitle: 'Built for Modern Workshops',
  storyText: 'AutoCarePro is a smart web-based auto workshop management system created to replace slow and outdated paper-based processes. Our goal is to make workshop operations faster, easier, and more organized for both customers and mechanics.\n' +
    'We believe every customer should stay informed about their vehicle’s repair progress in real time, while mechanics should have a clear and efficient digital workspace to manage their daily tasks.\n' +
    'From booking repair services to purchasing genuine spare parts online, AutoCarePro combines everything a modern workshop needs into one simple and accessible platform.',
  storyImage: '/media/engine/engine3.jpg',
  // icon|title|text|link|link text
  pillars: 'bi-wrench-adjustable|Expert Repair Services|Book vehicle repair services online and track your vehicle status in real time, from pending to completed.|/services|View services\n' +
    'bi-box-seam-fill|Genuine Spare Parts Shop|Browse and purchase genuine spare parts directly from our workshop inventory through a simple online platform.|/shop|Shop parts\n' +
    'bi-cpu-fill|Smart Management|Admins and mechanics manage workshop operations digitally: job assignments, repair updates and inventory tracking.|/my-repairs|Track my repairs',
  // icon|title|text
  whyUs: 'bi-clock-fill|Real-time Status|Track your repair from anywhere, anytime.\n' +
    'bi-shield-fill-check|Genuine Parts|All parts sourced from trusted suppliers.\n' +
    'bi-people-fill|Skilled Mechanics|An experienced, specialized workshop team.\n' +
    'bi-globe-central-south-asia-fill|100% Online|Book, track and buy from any device.',
  values: "bi-patch-check-fill|Integrity|We never recommend a repair you don't need. Our diagnostics are thorough and our quotes honest.\n" +
    'bi-wrench-adjustable|Expertise|Continuous training and top-tier tools for every job.\n' +
    "bi-house-heart-fill|Community|We're your neighbors. Supporting local families and businesses is at the heart of what we do.\n" +
    'bi-check-circle-fill|Reliability|On-time service you can count on, every time.',
  // name|role
  team: 'Mrs. Kuenzang Lhamo|Diploma: CSN\nMr. Ugyen Dorji|Diploma: CSN\nMrs. Chungku Wangmo|Diploma: CSN',
  ctaTitle: 'Ready to get started?',
  ctaText: "Whether it's a routine service or a major repair, we're here to help. Reach out to us today for a free estimate.",

  // ---------- Shop pages (slug|name|description) — the name is also the Inventory category ----------
  shopCategories: 'auto-parts|Auto Parts|Engine oil, brake pads, batteries, tyres and more, all genuine parts.\n' +
    'accessories|Car Accessories|Upgrade comfort and style with seat covers, cameras, lights and more.\n' +
    'cleaning|Cleaning Products|Everything you need to keep your car clean inside and out.\n' +
    'safety|Emergency & Safety|Be ready for the road with jumper cables, first aid and safety gear.',

  // ---------- Lists used in forms ----------
  // vehicle types the customer can pick when booking (one per line)
  vehicleTypes: 'Car\nSUV\nPickup\nVan / Bus',
  // The workshop services Toyota only: type|model, one per line
  carModels: 'Car|Corolla\nCar|Yaris\nSUV|RAV4\nSUV|Fortuner\nSUV|Land Cruiser Prado\nPickup|Hilux\nVan / Bus|HiAce\nVan / Bus|Coaster',
  specializations: 'Engine & Diagnostics\nBrake Systems\nGeneral Repairs\nElectrical Systems\nBody & Paint\nAC & Cooling\nTyres & Alignment',
};

// Create the table and add any missing setting (existing values are never changed)
async function setupSettings(conn = db) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS settings (
      name varchar(60) NOT NULL PRIMARY KEY,
      value text DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  for (const [name, value] of Object.entries(DEFAULT_SETTINGS)) {
    const [found] = await conn.query('SELECT name FROM settings WHERE name = ?', [name]);
    if (found.length === 0) await conn.query('INSERT INTO settings (name, value) VALUES (?, ?)', [name, value]);
  }
}

// All settings as one object: { timeSlots: '08:00 AM\n...', maxPerSlot: '2', ... }
async function getSettings() {
  const [rows] = await db.query('SELECT name, value FROM settings');
  const out = {};
  rows.forEach((r) => { out[r.name] = r.value; });
  return out;
}

// Small helpers for the booking rules
const toLines = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);

async function bookingRules() {
  const s = await getSettings();
  return {
    timeSlots: toLines(s.timeSlots),
    maxPerSlot: Number(s.maxPerSlot) || 1,
    pickupFee: Number(s.pickupFee) || 0,
  };
}

// Toyota models from the admin's list: [{ type, model }]
function toyotaModels(s) {
  return toLines(s.carModels).map((l) => l.split('|').map((x) => x.trim())).filter((p) => p[0] && p[1])
    .map(([type, model]) => ({ type, model }));
}

// Checks "Toyota <model> <year>" against the admin's list for that vehicle type.
// Returns the tidy text, or null if the model is not in the list for that type.
async function checkToyota(type, vehicle) {
  const s = await getSettings();
  const v = String(vehicle || '').trim().replace(/\s+/g, ' ');
  const thisYear = new Date().getFullYear();
  for (const m of toyotaModels(s)) {
    if (m.type !== type) continue;
    const start = 'Toyota ' + m.model;
    if (v === start) return v;
    if (v.startsWith(start + ' ')) {
      const year = Number(v.slice(start.length + 1));
      if (Number.isInteger(year) && year >= 1980 && year <= thisYear + 1) return v;
    }
  }
  return null;
}

// The vehicle type if it is in the admin's list (Website Content -> Lists), otherwise null
async function checkVehicleType(type) {
  const s = await getSettings();
  const list = toLines(s.vehicleTypes);
  const t = String(type || '').trim();
  return list.includes(t) ? t : null;
}

// Runs every time the server starts, so the database is always up to date
// (no extra command needed). It only ADDS what is missing, it never deletes data.
async function upgradeDatabase() {
  await setupSettings();                       // adds new settings such as vehicleTypes
  // The old general list (power tiller, JCB …) -> the Toyota types, only if the admin never changed it
  await db.query("UPDATE settings SET value = ? WHERE name = 'vehicleTypes' AND value LIKE 'Light vehicle (car, SUV)%Earth-moving machine (excavator, JCB)'",
    [DEFAULT_SETTINGS.vehicleTypes]);
  const [col] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repairs' AND COLUMN_NAME = 'vehicleType'`);
  if (Number(col[0].n) === 0) {
    await db.query('ALTER TABLE repairs ADD COLUMN vehicleType varchar(60) DEFAULT NULL AFTER customerId');
    console.log('Database: added the column repairs.vehicleType');
  }
  // Profile photo of customers (saved in the database as text)
  const [pc] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'photo'`);
  if (Number(pc[0].n) === 0) {
    await db.query('ALTER TABLE customers ADD COLUMN photo MEDIUMTEXT NULL');
    console.log('Database: added the column customers.photo');
  }
  // Messages from the contact form (Contact page -> admin → Messages)
  await db.query(`CREATE TABLE IF NOT EXISTS contact_messages (
      id int NOT NULL AUTO_INCREMENT,
      name varchar(80) NOT NULL,
      email varchar(120) NOT NULL,
      phone varchar(20) DEFAULT NULL,
      subject varchar(80) NOT NULL,
      message text NOT NULL,
      status varchar(10) NOT NULL DEFAULT 'new',
      createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )`);
}

module.exports = { DEFAULT_SETTINGS, setupSettings, getSettings, bookingRules, checkVehicleType, checkToyota, upgradeDatabase };
