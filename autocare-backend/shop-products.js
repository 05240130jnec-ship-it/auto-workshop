// shop-products.js — puts the website shop products (with their pictures) into the inventory.
//
// Run once:   node shop-products.js
// It only ADDS products whose SKU is missing, so it never deletes or changes your data.
// After that the admin controls everything on the Inventory page:
// name, price, stock, category, picture, "Show in shop?" — or delete a product.
// (seed.js also calls addShopProducts() so a fresh database has the shop filled.)

const db = require('./db');

// [id, sku, name, category (= shop page), stock, reorder level, price, picture]
const SHOP_PRODUCTS = [
  ['P-201', 'engine-oil', 'Engine Oil', 'Auto Parts', 20, 5, 1000, '/media/oil/oil2.jpg'],
  ['P-202', 'brake-pads', 'Brake Pads', 'Auto Parts', 20, 5, 1800, '/media/brake/brake2.jpg'],
  ['P-203', 'lubricants', 'Lubricants', 'Auto Parts', 20, 5, 1000, '/media/oil/oil3.jpg'],
  ['P-204', 'battery', 'Batteries', 'Auto Parts', 20, 5, 4500, '/media/accessories/batteries.jpg'],
  ['P-205', 'tires', 'Tires', 'Auto Parts', 20, 5, 3500, '/media/accessories/tire.jpg'],
  ['P-206', 'spark-plugs', 'Spark Plugs', 'Auto Parts', 20, 5, 350, '/media/accessories/spake%20plug.jpg'],
  ['P-207', 'seat-covers', 'Seat Covers', 'Car Accessories', 20, 5, 3500, '/media/accessories/seat%20covers.jpg'],
  ['P-208', 'phone-holder', 'Phone Holders', 'Car Accessories', 20, 5, 800, '/media/accessories/phone%20holder.jpg'],
  ['P-209', 'dash-camera', 'Dash Cameras', 'Car Accessories', 20, 5, 4500, '/media/accessories/desh%20carmer.jpg'],
  ['P-210', 'car-perfume', 'Car Perfumes', 'Car Accessories', 20, 5, 500, '/media/accessories/car%20perform.jpg'],
  ['P-211', 'speakers', 'Speakers', 'Car Accessories', 20, 5, 2800, '/media/accessories/speaker.jpg'],
  ['P-212', 'alloy-wheels', 'Alloy Wheels', 'Car Accessories', 20, 5, 8500, '/media/accessories/alloy%20wheel.jpg'],
  ['P-213', 'car-shampoo', 'Car Shampoo', 'Cleaning Products', 20, 5, 350, '/media/cleaning/carshampoo.jpg'],
  ['P-214', 'wax-polish', 'Wax / Polish', 'Cleaning Products', 20, 5, 600, '/media/accessories/wax.jpg'],
  ['P-215', 'tire-cleaner', 'Tire Cleaner', 'Cleaning Products', 20, 5, 400, '/media/cleaning/tirecleanser.jpg'],
  ['P-216', 'interior-spray', 'Interior Spray', 'Cleaning Products', 20, 5, 450, '/media/accessories/interior%20Spray.jpg'],
  ['P-217', 'microfiber', 'Microfiber Cloth', 'Cleaning Products', 20, 5, 150, '/media/accessories/microfiber.jpg'],
  ['P-218', 'jumper-cables', 'Jumper Cables', 'Emergency & Safety', 20, 5, 900, '/media/accessories/jumper%20cable.jpg'],
  ['P-219', 'tire-inflator', 'Tire Inflator', 'Emergency & Safety', 20, 5, 2200, '/media/accessories/tire%20inflator.jpg'],
  ['P-220', 'tool-kit', 'Tool Kits', 'Emergency & Safety', 20, 5, 4000, '/media/accessories/tool%20kit.jpg'],
  ['P-221', 'first-aid', 'First Aid Kit', 'Emergency & Safety', 20, 5, 1200, '/media/accessories/first%20aid%20kit.jpg'],
];

// Adds the products that are missing (checked by SKU). Returns how many were added.
async function addShopProducts(conn = db) {
  let added = 0;
  for (const [id, sku, name, category, stock, reorder, price, image] of SHOP_PRODUCTS) {
    const [bySku] = await conn.query('SELECT id FROM inventory WHERE sku = ?', [sku]);
    if (bySku.length) continue;
    // use the usual id (P-201 …) unless the admin already used it for another part
    const [byId] = await conn.query('SELECT id FROM inventory WHERE id = ?', [id]);
    let newId = id;
    if (byId.length) {
      const [last] = await conn.query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) AS last FROM inventory');
      newId = 'P-' + ((last[0].last || 100) + 1);
    }
    await conn.query(
      `INSERT INTO inventory (id, sku, name, category, stock, reorder, price, supplierId, image, inShop)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 1)`,
      [newId, sku, name, category, stock, reorder, price, image]);
    added++;
  }
  return added;
}

module.exports = { addShopProducts };

// When run directly:  node shop-products.js
if (require.main === module) {
  addShopProducts()
    .then(async (n) => {
      console.log(`✅ ${n} shop products added (with pictures). Edit them on the admin Inventory page.`);
      await db.end();
    })
    .catch((err) => {
      console.error('❌ Could not add the shop products:', err.message);
      process.exit(1);
    });
}
