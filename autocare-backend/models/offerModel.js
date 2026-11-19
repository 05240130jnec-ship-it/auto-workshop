// models/offerModel.js — the MySQL table `offers` (the Home page slideshow).

const db = require('../config/db');
const { updateFields, insertRow, deleteById } = require('./helpers');

const clean = (o) => ({ ...o, percent: Number(o.percent), active: !!o.active });

// Offers that are on and not expired (an offer hides itself the day after its end date)
async function findCurrent() {
  const [rows] = await db.query(
    `SELECT o.*, s.title AS serviceTitle, s.page AS servicePage
     FROM offers o LEFT JOIN services s ON s.slug = o.serviceSlug
     WHERE o.active = 1 AND (o.endDate IS NULL OR o.endDate >= CURDATE())
     ORDER BY o.endDate, o.id`);
  return rows.map(clean);
}

async function findAll() {
  const [rows] = await db.query('SELECT * FROM offers ORDER BY id');
  return rows.map(clean);
}

const create = (values) => insertRow('offers', values);
const update = (id, values) => updateFields('offers', id, values);
const remove = (id) => deleteById('offers', id);

module.exports = { findCurrent, findAll, create, update, remove };
