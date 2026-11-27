// controllers/cartController.js — the customer's shopping cart.
// Only logged-in customers (see routes/cart.js). Price, name and stock always come from MySQL.

const Cart = require('../models/cartModel');
const Inventory = require('../models/inventoryModel');

// The cart + its total, sent back after every change so the website can show it straight away
async function cartOf(customerId) {
  const items = await Cart.findByCustomer(customerId);
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const count = items.reduce((sum, it) => sum + it.qty, 0);
  return { items, total, count };
}

// A whole number from 1 to 100, or null
function cleanQty(qty) {
  const n = Number(qty);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;
}

// A product of the shop (by id "P-101" or sku "engine-oil"), or null
async function shopPart(idOrSku) {
  const part = idOrSku ? await Inventory.findByIdOrSku(idOrSku) : null;
  return part && Number(part.inShop) === 1 ? part : null;
}

// GET /api/cart  -> my cart
async function getCart(req, res) {
  res.json(await cartOf(req.user.id));
}

// POST /api/cart   body: { partId, qty }  -> add to cart
async function addItem(req, res) {
  const qty = cleanQty((req.body || {}).qty ?? 1);
  if (!qty) return res.status(400).json({ error: 'Quantity must be a whole number from 1 to 100.' });
  const part = await shopPart((req.body || {}).partId);
  if (!part) return res.status(404).json({ error: 'Product not found.' });

  const already = await Cart.qtyInCart(req.user.id, part.id);
  if (already + qty > Number(part.stock)) {
    const msg = Number(part.stock) === 0 ? `${part.name} is out of stock.`
      : already > 0 ? `You already have ${already} in your cart. Only ${part.stock} in stock.`
      : `Only ${part.stock} left in stock.`;
    return res.status(409).json({ error: msg });
  }
  await Cart.add(req.user.id, part.id, qty);
  res.status(201).json(await cartOf(req.user.id));
}

// PATCH /api/cart/P-101   body: { qty }  -> change the quantity
async function updateItem(req, res) {
  const qty = cleanQty((req.body || {}).qty);
  if (!qty) return res.status(400).json({ error: 'Quantity must be a whole number from 1 to 100.' });
  const part = await shopPart(req.params.partId);
  if (!part) return res.status(404).json({ error: 'Product not found.' });
  if (qty > Number(part.stock)) return res.status(409).json({ error: `Only ${part.stock} left in stock.` });

  if (!(await Cart.setQty(req.user.id, part.id, qty))) return res.status(404).json({ error: 'This product is not in your cart.' });
  res.json(await cartOf(req.user.id));
}

// DELETE /api/cart/P-101  -> remove from cart
async function removeItem(req, res) {
  if (!(await Cart.remove(req.user.id, req.params.partId))) {
    return res.status(404).json({ error: 'This product is not in your cart.' });
  }
  res.json(await cartOf(req.user.id));
}

// POST /api/cart/checkout   body: { pickup: '2026-12-01', partIds: ['P-101', 'P-205'] }
//   -> order only the ticked products; the others stay in the cart
async function checkout(req, res) {
  const pickup = String((req.body || {}).pickup || '');
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickup) || pickup < todayUtc) {
    return res.status(400).json({ error: 'Please choose a pickup date from today on.' });
  }
  const partIds = (req.body || {}).partIds
  if (!Array.isArray(partIds) || partIds.length === 0 || partIds.length > 100 || !partIds.every((x) => typeof x === 'string')) {
    return res.status(400).json({ error: 'Please tick at least one product to order.' });
  }
  try {
    const result = await Cart.checkout(req.user.id, pickup, partIds);
    res.status(201).json(result);          // { ids: ['R-1012', 'R-1013'], total }
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, checkout };
