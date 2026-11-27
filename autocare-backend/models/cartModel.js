// models/cartModel.js — the MySQL table `cart_items` (the shopping cart of each customer).
// One row = one product in one customer's cart. The same product twice = a bigger qty, not a new row.
// Like big online shops, the cart is saved in the database, so it is still there on another device.

const db = require('../config/db');

// The table is made by config/upgrade-database.js when the server starts.
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS cart_items (
  id int NOT NULL AUTO_INCREMENT,
  customerId varchar(20) NOT NULL,
  partId varchar(20) NOT NULL,
  qty int NOT NULL DEFAULT 1,
  addedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY one_row_per_part (customerId, partId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`;

// The same text setting (collation) as the other tables (database.sql), otherwise MySQL
// cannot compare cart_items.partId with inventory.id. Fixes a table made before this line existed.
const FIX_COLLATION = 'ALTER TABLE cart_items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci';

// MySQL sends DECIMAL as text ("1000.00") → normal numbers
const clean = (r) => ({ ...r, price: Number(r.price), stock: Number(r.stock), qty: Number(r.qty) });

// My cart, with the product details from the inventory (only products still shown in the shop)
async function findByCustomer(customerId) {
  const [rows] = await db.query(
    `SELECT c.partId, c.qty, i.sku, i.name, i.category, i.price, i.stock, i.image
     FROM cart_items c
     JOIN inventory i ON i.id = c.partId
     WHERE c.customerId = ? AND i.inShop = 1
     ORDER BY c.addedAt, c.id`, [customerId]);
  return rows.map(clean);
}

// How many of this part are already in my cart (0 = none)
async function qtyInCart(customerId, partId) {
  const [rows] = await db.query('SELECT qty FROM cart_items WHERE customerId = ? AND partId = ?', [customerId, partId]);
  return rows.length ? Number(rows[0].qty) : 0;
}

// Add to cart: a new row, or a bigger qty if the part is already there
async function add(customerId, partId, qty) {
  await db.query(
    'INSERT INTO cart_items (customerId, partId, qty) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty = qty + ?',
    [customerId, partId, qty, qty]);
}

// Change the quantity. Returns false if the part is not in my cart.
async function setQty(customerId, partId, qty) {
  const [result] = await db.query('UPDATE cart_items SET qty = ? WHERE customerId = ? AND partId = ?', [qty, customerId, partId]);
  return result.affectedRows > 0;
}

// Remove one product. Returns false if it was not in my cart.
async function remove(customerId, partId) {
  const [result] = await db.query('DELETE FROM cart_items WHERE customerId = ? AND partId = ?', [customerId, partId]);
  return result.affectedRows > 0;
}

// Place the order for the ticked products (partIds): every product becomes one order (reservation),
// the stock goes down, and only those products leave the cart. The rest stay in the cart for later.
// It is ONE transaction: if one product does not have enough stock, nothing is ordered at all.
// Throws an error with .status = 400/409 and a message for the customer.
async function checkout(customerId, pickup, partIds) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query(
      `SELECT c.partId, c.qty, i.sku, i.name, i.price, i.stock
       FROM cart_items c JOIN inventory i ON i.id = c.partId
       WHERE c.customerId = ? AND i.inShop = 1 AND c.partId IN (?)
       ORDER BY c.addedAt, c.id
       FOR UPDATE`, [customerId, partIds]);
    if (items.length === 0) throw Object.assign(new Error('Please tick at least one product to order.'), { status: 400 });

    const ids = [];
    let total = 0;
    for (const it of items) {
      const [taken] = await conn.query(
        'UPDATE inventory SET stock = stock - ? WHERE id = ? AND stock >= ?', [it.qty, it.partId, it.qty]);
      if (taken.affectedRows === 0) {
        throw Object.assign(new Error(`Only ${it.stock} ${it.name} left in stock. Please change the quantity.`), { status: 409 });
      }
      const [[last]] = await conn.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM reservations');
      const id = 'R-' + ((last.last || 1000) + 1);
      await conn.query(
        `INSERT INTO reservations (id, customerId, slug, name, price, qty, pickup, status, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', CURDATE())`,
        [id, customerId, it.sku, it.name, it.price, it.qty, pickup]);
      ids.push(id);
      total += Number(it.price) * Number(it.qty);
    }
    await conn.query('DELETE FROM cart_items WHERE customerId = ? AND partId IN (?)', [customerId, items.map((it) => it.partId)]);
    await conn.commit();
    return { ids, total };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { CREATE_TABLE, FIX_COLLATION, findByCustomer, qtyInCart, add, setQty, remove, checkout };
