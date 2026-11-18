// routes/content.js — website content from MySQL: services, offers and shop products.
//
// Anyone can read (the public website needs it, even before login):
//   GET /api/content/services            -> active services (Home, Services page, Booking)
//   GET /api/content/services/brake-repair
//   GET /api/content/services-all        -> all services, also hidden ones (admin + mechanic only)
//   GET /api/content/offers              -> offers that are active and not expired (Home slideshow)
//   GET /api/content/products            -> products shown in the shop (?category=Auto Parts)
//   GET /api/content/products/engine-oil -> one product (Buy Now page)
//
// Only the admin can change services and offers:
//   GET/POST /api/content/admin/services     PATCH/DELETE /api/content/admin/services/:id
//   GET/POST /api/content/admin/offers       PATCH/DELETE /api/content/admin/offers/:id
// (Shop products are inventory parts: the admin edits them on the Inventory page.)

const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { DEFAULT_SETTINGS, getSettings } = require('../settings');

const router = express.Router();
const adminOnly = [requireAuth, requireRole('admin')];

// MySQL sends DECIMAL as text ("1000.00") and booleans as 0/1 → make them normal values
const cleanService = (s) => ({ ...s, price: Number(s.price), active: !!s.active });
const cleanOffer = (o) => ({ ...o, percent: Number(o.percent), active: !!o.active });
const cleanProduct = (p) => ({ ...p, price: Number(p.price), stock: Number(p.stock) });

// ---------- PUBLIC ----------

router.get('/services', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM services WHERE active = 1 ORDER BY sortOrder, id');
  res.json(rows.map(cleanService));
});

// GET /api/content/services-all  -> every service, also the workshop-only ones
// (for the admin "New job" form and the mechanic "Log Services" box)
router.get('/services-all', requireAuth, requireRole('admin', 'mechanic'), async (req, res) => {
  const [rows] = await db.query('SELECT * FROM services ORDER BY sortOrder, id');
  res.json(rows.map(cleanService));
});

// :slug can be the slug ("brake-repair") or the end of the old page address ("brake" for /services/brake)
router.get('/services/:slug', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM services WHERE (slug = ? OR page = ?) AND active = 1', [req.params.slug, '/services/' + req.params.slug]);
  if (rows.length === 0) return res.status(404).json({ error: 'Service not found.' });
  res.json(cleanService(rows[0]));
});

router.get('/offers', async (req, res) => {
  // An offer hides itself the day after its end date
  const [rows] = await db.query(
    `SELECT o.*, s.title AS serviceTitle, s.page AS servicePage
     FROM offers o LEFT JOIN services s ON s.slug = o.serviceSlug
     WHERE o.active = 1 AND (o.endDate IS NULL OR o.endDate >= CURDATE())
     ORDER BY o.endDate, o.id`);
  res.json(rows.map(cleanOffer));
});

const PRODUCT_FIELDS = 'id, sku, name, category, price, stock, image';

router.get('/products', async (req, res) => {
  let sql = `SELECT ${PRODUCT_FIELDS} FROM inventory WHERE inShop = 1`;
  const params = [];
  if (req.query.category) { sql += ' AND category = ?'; params.push(req.query.category); }
  const [rows] = await db.query(sql + ' ORDER BY id', params);
  res.json(rows.map(cleanProduct));
});

router.get('/products/:sku', async (req, res) => {
  const [rows] = await db.query(`SELECT ${PRODUCT_FIELDS} FROM inventory WHERE inShop = 1 AND sku = ?`, [req.params.sku]);
  if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
  res.json(cleanProduct(rows[0]));
});

// ---------- ADMIN ----------

// Copies only the allowed fields that were sent, e.g. pick({price: 5, x: 1}, ['price']) -> {price: 5}
function pick(body, allowed) {
  const out = {};
  allowed.forEach((f) => { if (body[f] !== undefined) out[f] = body[f]; });
  if ('active' in out) out.active = out.active === true || out.active === 1 || out.active === '1' || out.active === 'yes' ? 1 : 0;
  if ('endDate' in out && !out.endDate) out.endDate = null;
  return out;
}

async function insertRow(table, values) {
  const cols = Object.keys(values);
  const [result] = await db.query(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, Object.values(values));
  return result.insertId;
}

async function updateRow(table, id, values) {
  const cols = Object.keys(values);
  if (cols.length === 0) return null;
  const [result] = await db.query(
    `UPDATE ${table} SET ${cols.map((c) => c + ' = ?').join(', ')} WHERE id = ?`, [...Object.values(values), id]);
  return result.affectedRows > 0;
}

// ----- services -----
const SERVICE_FIELDS = ['slug', 'title', 'serviceName', 'price', 'image', 'shortText', 'page', 'sortOrder', 'active', 'intro', 'description', 'points', 'gallery'];

router.get('/admin/services', ...adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM services ORDER BY sortOrder, id');
  res.json(rows.map(cleanService));
});

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

// Pictures: an uploaded picture ("data:image/…", made small in the browser) or an old path ("/media/…")
const MAX_PICTURE = 600 * 1024;     // about 600 KB of text for one picture
function badPicture(src) {
  if (!src) return false;
  if (src.startsWith('/')) return src.length > 200;
  return !/^data:image\/(jpeg|png|webp);base64,/.test(src) || src.length > MAX_PICTURE;
}
function checkServicePictures(v) {
  if ('image' in v && badPicture(v.image)) return 'The picture is not valid or is too big. Please choose another one.';
  if ('gallery' in v && v.gallery) {
    const pics = String(v.gallery).split('\n').map((x) => x.trim()).filter(Boolean);
    if (pics.length > 3) return 'You can add 3 more pictures at most.';
    if (pics.some(badPicture)) return 'One of the extra pictures is not valid or is too big.';
    v.gallery = pics.join('\n');
  }
  return '';
}

router.post('/admin/services', ...adminOnly, async (req, res) => {
  const v = pick(req.body || {}, SERVICE_FIELDS);
  v.title = String(v.title || '').trim();
  if (!v.title || v.price === undefined || v.price === '') {
    return res.status(400).json({ error: 'Title and price are required.' });
  }
  if (!(Number(v.price) >= 0)) return res.status(400).json({ error: 'Please enter a valid price.' });
  const bad = checkServicePictures(v);
  if (bad) return res.status(400).json({ error: bad });
  if (!v.slug) v.slug = await freeSlug(v.title);          // made from the title
  if (!v.serviceName) v.serviceName = v.title;            // the name used on repair jobs
  if (v.sortOrder === undefined) {                       // new services go to the end of the list
    const [[m]] = await db.query('SELECT COALESCE(MAX(sortOrder), 0) + 10 AS next FROM services');
    v.sortOrder = m.next;
  }
  try {
    const id = await insertRow('services', v);
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Another service already uses this name.' });
    throw err;
  }
});

router.patch('/admin/services/:id', ...adminOnly, async (req, res) => {
  const v = pick(req.body || {}, SERVICE_FIELDS);
  if ('title' in v) {
    v.title = String(v.title || '').trim();
    if (!v.title) return res.status(400).json({ error: 'The title cannot be empty.' });
    v.serviceName = v.title;             // new repair jobs use the new name (old jobs keep theirs)
  }
  const bad = checkServicePictures(v);
  if (bad) return res.status(400).json({ error: bad });
  let ok;
  try {
    ok = await updateRow('services', req.params.id, v);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Another service already uses this name.' });
    throw err;
  }
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Service not found.' });
  res.json({ id: Number(req.params.id) });
});

router.delete('/admin/services/:id', ...adminOnly, async (req, res) => {
  const [result] = await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Service not found.' });
  res.json({ deleted: Number(req.params.id) });
});

// ----- offers -----
const OFFER_FIELDS = ['tag', 'title', 'percent', 'text', 'points', 'serviceSlug', 'image', 'endDate', 'active'];

router.get('/admin/offers', ...adminOnly, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM offers ORDER BY id');
  res.json(rows.map(cleanOffer));
});

router.post('/admin/offers', ...adminOnly, async (req, res) => {
  const v = pick(req.body || {}, OFFER_FIELDS);
  if (!v.title) return res.status(400).json({ error: 'Please enter a title.' });
  const id = await insertRow('offers', v);
  res.status(201).json({ id });
});

router.patch('/admin/offers/:id', ...adminOnly, async (req, res) => {
  const ok = await updateRow('offers', req.params.id, pick(req.body || {}, OFFER_FIELDS));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Offer not found.' });
  res.json({ id: Number(req.params.id) });
});

router.delete('/admin/offers/:id', ...adminOnly, async (req, res) => {
  const [result] = await db.query('DELETE FROM offers WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Offer not found.' });
  res.json({ deleted: Number(req.params.id) });
});

// ----- settings: page text, contact details, booking rules, shop categories -----
//   GET   /api/content/settings          -> everyone (the website needs them)
//   PATCH /api/content/admin/settings    -> admin, body { homeTitle: '...', pickupFee: '600' }
router.get('/settings', async (req, res) => {
  res.json(await getSettings());
});

router.patch('/admin/settings', ...adminOnly, async (req, res) => {
  const body = req.body || {};
  const names = Object.keys(body).filter((k) => k in DEFAULT_SETTINGS);   // only known settings
  if (names.length === 0) return res.status(400).json({ error: 'Nothing to update.' });
  if ('maxPerSlot' in body && !(Number(body.maxPerSlot) >= 1)) return res.status(400).json({ error: 'Cars per time slot must be 1 or more.' });
  if ('pickupFee' in body && !(Number(body.pickupFee) >= 0)) return res.status(400).json({ error: 'The pickup fee must be 0 or more.' });
  if ('timeSlots' in body && !String(body.timeSlots).trim()) return res.status(400).json({ error: 'Add at least one time slot.' });
  if ('shopCategories' in body && !String(body.shopCategories).trim()) return res.status(400).json({ error: 'Add at least one shop page.' });
  for (const name of names) {
    const value = String(body[name] ?? '');
    await db.query('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [name, value]);
  }
  res.json(await getSettings());
});

module.exports = router;
