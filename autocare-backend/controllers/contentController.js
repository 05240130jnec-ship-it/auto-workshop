// controllers/contentController.js — website content from MySQL: services, offers,
// shop products and settings (page text, contact details, booking rules).
// Anyone can read; only the admin can change (see routes/content.js).

const Service = require('../models/serviceModel');
const Offer = require('../models/offerModel');
const Inventory = require('../models/inventoryModel');
const Settings = require('../models/settingsModel');
const { DEFAULT_SETTINGS } = require('../config/default-settings');

// Copies only the allowed fields that were sent, e.g. pick({price: 5, x: 1}, ['price']) -> {price: 5}
function pick(body, allowed) {
  const out = {};
  allowed.forEach((f) => { if (body[f] !== undefined) out[f] = body[f]; });
  if ('active' in out) out.active = out.active === true || out.active === 1 || out.active === '1' || out.active === 'yes' ? 1 : 0;
  if ('endDate' in out && !out.endDate) out.endDate = null;
  return out;
}

// ---------- PUBLIC ----------

// GET /api/content/services  -> active services (Home, Services page, Booking)
async function activeServices(req, res) {
  res.json(await Service.findActive());
}

// GET /api/content/services-all  -> every service, also the workshop-only ones
// (for the admin "New job" form and the mechanic "Log Services" box)
async function allServices(req, res) {
  res.json(await Service.findAll());
}

// GET /api/content/services/brake-repair
async function oneService(req, res) {
  const service = await Service.findActiveBySlug(req.params.slug);
  if (!service) return res.status(404).json({ error: 'Service not found.' });
  res.json(service);
}

// GET /api/content/offers  -> offers that are active and not expired (Home slideshow)
async function currentOffers(req, res) {
  res.json(await Offer.findCurrent());
}

// GET /api/content/products  -> products shown in the shop (?category=Auto Parts)
async function products(req, res) {
  res.json(await Inventory.findShopProducts(req.query.category));
}

// GET /api/content/products/engine-oil  -> one product (Buy Now page)
async function oneProduct(req, res) {
  const product = await Inventory.findShopProduct(req.params.sku);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}

// ---------- ADMIN: services ----------

const SERVICE_FIELDS = ['slug', 'title', 'serviceName', 'price', 'image', 'shortText', 'page', 'sortOrder', 'active', 'intro', 'description', 'points', 'gallery'];

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

async function createService(req, res) {
  const v = pick(req.body || {}, SERVICE_FIELDS);
  v.title = String(v.title || '').trim();
  if (!v.title || v.price === undefined || v.price === '') {
    return res.status(400).json({ error: 'Title and price are required.' });
  }
  if (!(Number(v.price) >= 0)) return res.status(400).json({ error: 'Please enter a valid price.' });
  const bad = checkServicePictures(v);
  if (bad) return res.status(400).json({ error: bad });
  if (!v.slug) v.slug = await Service.freeSlug(v.title);          // made from the title
  if (!v.serviceName) v.serviceName = v.title;                    // the name used on repair jobs
  if (v.sortOrder === undefined) v.sortOrder = await Service.nextSortOrder();   // new services go to the end
  try {
    const id = await Service.create(v);
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Another service already uses this name.' });
    throw err;
  }
}

async function updateService(req, res) {
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
    ok = await Service.update(req.params.id, v);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Another service already uses this name.' });
    throw err;
  }
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Service not found.' });
  res.json({ id: Number(req.params.id) });
}

async function deleteService(req, res) {
  if (!(await Service.remove(req.params.id))) return res.status(404).json({ error: 'Service not found.' });
  res.json({ deleted: Number(req.params.id) });
}

// ---------- ADMIN: offers ----------

const OFFER_FIELDS = ['tag', 'title', 'percent', 'text', 'points', 'serviceSlug', 'image', 'endDate', 'active'];

async function allOffers(req, res) {
  res.json(await Offer.findAll());
}

async function createOffer(req, res) {
  const v = pick(req.body || {}, OFFER_FIELDS);
  if (!v.title) return res.status(400).json({ error: 'Please enter a title.' });
  const id = await Offer.create(v);
  res.status(201).json({ id });
}

async function updateOffer(req, res) {
  const ok = await Offer.update(req.params.id, pick(req.body || {}, OFFER_FIELDS));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Offer not found.' });
  res.json({ id: Number(req.params.id) });
}

async function deleteOffer(req, res) {
  if (!(await Offer.remove(req.params.id))) return res.status(404).json({ error: 'Offer not found.' });
  res.json({ deleted: Number(req.params.id) });
}

// ---------- settings: page text, contact details, booking rules, shop categories ----------

// GET /api/content/settings  -> everyone (the website needs them)
async function getSettings(req, res) {
  res.json(await Settings.getSettings());
}

// PATCH /api/content/admin/settings  -> admin, body { homeTitle: '...', pickupFee: '600' }
async function updateSettings(req, res) {
  const body = req.body || {};
  const names = Object.keys(body).filter((k) => k in DEFAULT_SETTINGS);   // only known settings
  if (names.length === 0) return res.status(400).json({ error: 'Nothing to update.' });
  if ('maxPerSlot' in body && !(Number(body.maxPerSlot) >= 1)) return res.status(400).json({ error: 'Cars per time slot must be 1 or more.' });
  if ('pickupFee' in body && !(Number(body.pickupFee) >= 0)) return res.status(400).json({ error: 'The pickup fee must be 0 or more.' });
  if ('timeSlots' in body && !String(body.timeSlots).trim()) return res.status(400).json({ error: 'Add at least one time slot.' });
  if ('shopCategories' in body && !String(body.shopCategories).trim()) return res.status(400).json({ error: 'Add at least one shop page.' });
  for (const name of names) {
    await Settings.saveSetting(name, String(body[name] ?? ''));
  }
  res.json(await Settings.getSettings());
}

module.exports = {
  activeServices, allServices, oneService, currentOffers, products, oneProduct,
  createService, updateService, deleteService, allOffers, createOffer, updateOffer, deleteOffer,
  getSettings, updateSettings,
};
