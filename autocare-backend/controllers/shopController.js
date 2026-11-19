// controllers/shopController.js — the customer shop: reserve workshop parts, sell your own parts.

const Inventory = require('../models/inventoryModel');
const Reservation = require('../models/reservationModel');
const Listing = require('../models/listingModel');

// ---------- PARTS (the shop catalogue) ----------

// GET /api/shop/parts  -> parts that are in stock
async function parts(req, res) {
  res.json(await Inventory.findInStock());
}

// ---------- RESERVATIONS ----------

// GET /api/shop/reservations  -> my reservations
async function myReservations(req, res) {
  res.json(await Reservation.findByCustomer(req.user.id));
}

// POST /api/shop/reservations  -> reserve a part
async function reserve(req, res) {
  const { partId, qty, pickup } = req.body || {};
  const amount = Number(qty) || 1;

  if (!partId || !pickup) {
    return res.status(400).json({ error: 'Please choose a part and a pickup date.' });
  }

  // Price and name come from the database, not from the customer
  const part = await Inventory.findByIdOrSku(partId);
  if (!part) return res.status(404).json({ error: 'Part not found.' });

  // Take the stock only if there is enough
  if (!(await Inventory.takeStock(part.id, amount))) {
    return res.status(409).json({ error: `Only ${part.stock} left in stock.` });
  }

  const id = await Reservation.nextId();
  await Reservation.create({
    id, customerId: req.user.id, slug: part.sku, name: part.name, price: part.price, qty: amount, pickup,
  });
  res.status(201).json({ id });
}

// PATCH /api/shop/reservations/R-1001  -> cancel, and put the stock back
async function cancelReservation(req, res) {
  const { status } = req.body || {};
  if (status !== 'cancelled') {
    return res.status(400).json({ error: 'You can only cancel a reservation.' });
  }
  const reservation = await Reservation.findOneOfCustomer(req.params.id, req.user.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });
  if (reservation.status !== 'ready') {
    return res.status(400).json({ error: 'Only ready reservations can be cancelled.' });
  }

  await Reservation.setStatus(req.params.id, 'cancelled');
  await Inventory.addStockBySku(reservation.slug, reservation.qty);
  res.json({ id: req.params.id, status: 'cancelled' });
}

// ---------- LISTINGS (customer sells a part) ----------

// GET /api/shop/listings  -> my listings
async function myListings(req, res) {
  res.json(await Listing.findByCustomer(req.user.id));
}

// POST /api/shop/listings  -> offer a part to the workshop (the admin accepts or rejects it)
// photos: 1 to 3 pictures, made small in the browser and sent as text ("data:image/jpeg;base64,…")
async function createListing(req, res) {
  const { name, category, condition, price, qty, description } = req.body || {};

  if (!name || !price) {
    return res.status(400).json({ error: 'Please enter a name and a price.' });
  }
  const photos = Array.isArray(req.body.photos) ? req.body.photos : [];
  if (photos.length < 1 || photos.length > 3) {
    return res.status(400).json({ error: 'Please add 1 to 3 photos of the part.' });
  }
  if (photos.some((p) => typeof p !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(p) || p.length > 600 * 1024)) {
    return res.status(400).json({ error: 'One of the photos is not valid or is too big.' });
  }

  const id = await Listing.nextId();
  await Listing.create({
    id, customerId: req.user.id, name, category: category || 'Other', condition: condition || 'used',
    price, qty: Number(qty) || 1, description: description || '', photos: photos.join('\n'),
  });
  res.status(201).json({ id, status: 'review' });
}

module.exports = { parts, myReservations, reserve, cancelReservation, myListings, createListing };
