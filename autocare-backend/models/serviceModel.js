// models/serviceModel.js — the MySQL table `services` (workshop services shown on the website).

const db = require('../config/db');
const { updateFields, insertRow, deleteById } = require('./helpers');

// MySQL sends DECIMAL as text ("1000.00") and booleans as 0/1 → make them normal values
const clean = (s) => ({ ...s, price: Number(s.price), active: !!s.active });

// Only the ones shown on the website
async function findActive() {
  const [rows] = await db.query('SELECT * FROM services WHERE active = 1 ORDER BY sortOrder, id');
  return rows.map(clean);
}

// Every service, also the hidden / workshop-only ones
async function findAll() {
  const [rows] = await db.query('SELECT * FROM services ORDER BY sortOrder, id');
  return rows.map(clean);
}

// slug = "brake-repair", or the end of the old page address ("brake" for /services/brake)
async function findActiveBySlug(slug) {
  const [rows] = await db.query(
    'SELECT * FROM services WHERE (slug = ? OR page = ?) AND active = 1', [slug, '/services/' + slug]);
  return rows.length ? clean(rows[0]) : undefined;
}

// "Wheel Alignment & Balancing" -> "wheel-alignment-balancing" (the short code used in links)
function makeSlug(title) {
  return String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'service';
}

// The first free short code: wheel-alignment, wheel-alignment-2, wheel-alignment-3 …
async function freeSlug(title) {
  const base = makeSlug(title);
  const [rows] = await db.query('SELECT slug FROM services WHERE slug = ? OR slug LIKE ?', [base, base + '-%']);
  const used = new Set(rows.map((r) => r.slug));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(base + '-' + n)) n++;
  return base + '-' + n;
}

// New services go to the end of the list
async function nextSortOrder() {
  const [[m]] = await db.query('SELECT COALESCE(MAX(sortOrder), 0) + 10 AS next FROM services');
  return m.next;
}

const create = (values) => insertRow('services', values);
const update = (id, values) => updateFields('services', id, values);
const remove = (id) => deleteById('services', id);

module.exports = { findActive, findAll, findActiveBySlug, freeSlug, nextSortOrder, create, update, remove };
