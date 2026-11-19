// models/settingsModel.js — the MySQL table `settings` (name / value pairs):
// website text, contact details, booking rules and the lists used in forms.
// The starting values are in config/default-settings.js.

const db = require('../config/db');
const { DEFAULT_SETTINGS } = require('../config/default-settings');

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

// Save one setting (adds it, or changes the value if it is already there)
async function saveSetting(name, value) {
  await db.query('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [name, value]);
}

// ---------- Small helpers that read the settings ----------

const toLines = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);

// Booking rules: the time slots, cars per slot and pickup fee
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

module.exports = { setupSettings, getSettings, saveSetting, bookingRules, checkToyota, checkVehicleType };
