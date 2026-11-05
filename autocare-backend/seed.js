// seed.js — fills the database with the starting data: 1 admin, 1 mechanic, 1 customer,
// the website shop products (with pictures) and the website content. No sample suppliers, repairs or orders.
// Run with:  node seed.js
// It deletes old data first, so you can run it again any time to reset.

const bcrypt = require('bcrypt');
const db = require('./db');
const { setupContent } = require('./content-setup');   // services, offers, page settings
const { addShopProducts } = require('./shop-products'); // the website shop products + pictures

// Date helper: daysAgo(0) = today, daysAgo(3) = 3 days ago, daysAgo(-2) = in 2 days
function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  // ---------- 1. Empty all tables (children first because of foreign keys) ----------
  const tables = ['repair_parts', 'repair_services', 'repairs', 'orders', 'reservations',
                  'listings', 'inventory', 'suppliers', 'customers', 'mechanics', 'admins'];
  for (const t of tables) await db.query(`DELETE FROM ${t}`);
  // clear the wrong-login counts too (the table may not exist yet)
  await db.query('DELETE FROM login_attempts').catch(() => {});
  console.log('Old data removed');

  // ---------- 2. Hash the demo passwords once ----------
  const adminPass = await bcrypt.hash('admin123', 10);
  const mechPass  = await bcrypt.hash('mech123', 10);
  const userPass  = await bcrypt.hash('user123', 10);

  // ---------- 3. Admin ----------
  await db.query('INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)',
    ['admin', 'Admin User', 'admin@autocare.bt', adminPass]);

  // ---------- 4. Suppliers ----------
  // None: the admin adds real suppliers on the Suppliers page.
  const suppliers = [];

  // ---------- 5. Inventory ----------
  // Workshop parts: none — the admin adds them on the Inventory page.
  // (The website shop products are added below with addShopProducts.)
  const parts = [];
  for (const p of parts)
    await db.query('INSERT INTO inventory (id, sku, name, category, stock, reorder, price, supplierId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p);

  // ---------- 6. Mechanics ----------
  const mechanics = [
    ['M-001', 'Ugyen Dorji', 'ugyen@autocare.bt', '+975 17394436', 'Engine & Diagnostics', 8, 'active', '/media/mechanics/ugyen.jpeg', daysAgo(1460)]
  ];
  for (const m of mechanics)
    await db.query(
      'INSERT INTO mechanics (id, name, email, phone, specialization, experience, status, photo, joined, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [...m, mechPass]);

  // ---------- 7. Customers ----------
  const customers = [
    ['C-001', 'Karma Dorji', 'karma@gmail.com', '+975 17394436', 'Motithang, Thimphu', 'active', daysAgo(320)]
  ];
  for (const c of customers)
    await db.query(
      'INSERT INTO customers (id, name, email, phone, address, status, joined, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [...c, userPass]);

  // ---------- 8. Repairs and purchase orders ----------
  // None: real ones are made on the website (customer booking), by the admin (New Job)
  // and by mechanics (reorder parts).

  // ---------- Website content: services, offers, shop pictures ----------
  await setupContent(db, { reset: true });
  const shopCount = await addShopProducts(db);

    console.log(`✅ Starting data added: 1 admin, ${mechanics.length} mechanic, ${customers.length} customer, ` +
    `${shopCount} shop products with pictures, website content (no suppliers, repairs or orders)`);
  await db.end();   // close the connection so the script finishes
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});