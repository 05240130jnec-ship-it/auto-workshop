// models/inventoryModel.js — the MySQL table `inventory` (spare parts).
// Parts with inShop = 1 are also the products of the website shop.

const db = require('../config/db');
const { updateFields, deleteById } = require('./helpers');

const PRODUCT_FIELDS = 'id, sku, name, category, price, stock, image';   // what the shop shows

// MySQL sends DECIMAL as text ("1000.00") → make them normal numbers
const cleanProduct = (p) => ({ ...p, price: Number(p.price), stock: Number(p.stock) });

// ---------- finding parts ----------

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
  return rows[0];
}

// The id ("P-101") or the SKU ("engine-oil") both work
async function findByIdOrSku(idOrSku) {
  const [parts] = await db.query('SELECT * FROM inventory WHERE id = ? OR sku = ?', [idOrSku, idOrSku]);
  return parts[0];
}

// Customer shop: parts that are in stock
async function findInStock() {
  const [rows] = await db.query(
    'SELECT id, sku, name, category, price, stock FROM inventory WHERE stock > 0 ORDER BY name'
  );
  return rows;
}

// Mechanic: every part to choose from
async function findAllForMechanic() {
  const [rows] = await db.query('SELECT id, sku, name, category, stock, reorder, price FROM inventory ORDER BY name');
  return rows;
}

// Admin: all parts with the supplier name (lowOnly = only parts at or below the reorder level)
async function findAll(lowOnly) {
  let sql = `
    SELECT i.*, s.name AS supplierName, (i.stock <= i.reorder) AS lowStock
    FROM inventory i
    LEFT JOIN suppliers s ON s.id = i.supplierId`;
  if (lowOnly) sql += ' WHERE i.stock <= i.reorder';
  const [rows] = await db.query(sql + ' ORDER BY i.id');
  return rows;
}

async function countLow() {
  const [[row]] = await db.query('SELECT COUNT(*) AS total FROM inventory WHERE stock <= reorder');
  return row.total;
}

// Website shop products (optionally one category)
async function findShopProducts(category) {
  let sql = `SELECT ${PRODUCT_FIELDS} FROM inventory WHERE inShop = 1`;
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  const [rows] = await db.query(sql + ' ORDER BY id', params);
  return rows.map(cleanProduct);
}

async function findShopProduct(sku) {
  const [rows] = await db.query(`SELECT ${PRODUCT_FIELDS} FROM inventory WHERE inShop = 1 AND sku = ?`, [sku]);
  return rows.length ? cleanProduct(rows[0]) : undefined;
}

// ---------- stock ----------

// Take stock only if there is enough. Returns false if there was not enough.
async function takeStock(id, amount) {
  const [result] = await db.query(
    'UPDATE inventory SET stock = stock - ? WHERE id = ? AND stock >= ?', [amount, id, amount]
  );
  return result.affectedRows > 0;
}

async function addStock(id, amount) {
  await db.query('UPDATE inventory SET stock = stock + ? WHERE id = ?', [amount, id]);
}

async function addStockBySku(sku, amount) {
  await db.query('UPDATE inventory SET stock = stock + ? WHERE sku = ?', [amount, sku]);
}

// ---------- admin: add, edit, delete ----------

// "Brake Pad Front" -> "BRAKE-PAD-FRONT" (shop products use lowercase: "brake-pad-front"),
// with -2, -3 … added when that code is already used
async function freeSku(name, lower) {
  let base = String(name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'PART';
  base = lower ? base.toLowerCase() : base.toUpperCase();
  const [rows] = await db.query('SELECT sku FROM inventory WHERE sku = ? OR sku LIKE ?', [base, base + '-%']);
  const used = new Set(rows.map((r) => r.sku.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  let n = 2;
  while (used.has((base + '-' + n).toLowerCase())) n++;
  return base + '-' + n;
}

// Next id: P-101, P-102 …
async function nextId() {
  const [last] = await db.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM inventory');
  return 'P-' + ((last[0].last || 100) + 1);
}

async function create(p) {
  await db.query(
    `INSERT INTO inventory (id, sku, name, category, stock, reorder, price, supplierId, image, inShop)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.sku, p.name, p.category, p.stock, p.reorder, p.price, p.supplierId, p.image, p.inShop]
  );
}

async function findNameAndShop(id) {
  const [[row]] = await db.query('SELECT name, inShop FROM inventory WHERE id = ?', [id]);
  return row;
}

const update = (id, values) => updateFields('inventory', id, values);
const remove = (id) => deleteById('inventory', id);

module.exports = {
  findById, findByIdOrSku, findInStock, findAllForMechanic, findAll, countLow, findShopProducts, findShopProduct,
  takeStock, addStock, addStockBySku, freeSku, nextId, create, findNameAndShop, update, remove,
};
