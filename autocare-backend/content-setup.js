// content-setup.js — the website content that used to be typed into the React pages
// (offers, services + prices, shop products) now lives in MySQL.
//
// Run once on a database you already have (it keeps all your data):
//     node content-setup.js
//
// What it does (safe to run again any time):
//   1. creates the tables `services` and `offers` if they are missing
//   2. adds the columns `image` and `inShop` to `inventory` if they are missing
//   3. fills services/offers with the starting content if they are empty,
//      and adds the workshop-only services (Wheel Alignment, AC Service...) if missing
//   4. gives the shop products their picture and puts them in the shop
//
// seed.js also calls setupContent(db, { reset: true }) so a fresh database gets the same content.

const db = require('./db');
const { setupSettings } = require('./settings');   // website text + booking rules

// ---------- starting content (the same as the old static pages) ----------

const SERVICES = [
  // slug,               title,                   name on the repair,     price, picture,                        short text,                                                          detail page,          order
  ['engine-diagnostics', 'Engine Diagnostics',    'Engine Diagnostics',   1000, '/media/engine/engine1.jpg',      'Scan tools and expert checks to find engine problems early.',       '/services/engine',   1],
  ['brake-repair',       'Brake Pad Replacement', 'Brake Service',        9189, '/media/brake/brake1.png',        'Inspection and replacement of pads and discs with genuine parts.',  '/services/brake',    2],
  ['oil-change',         'Oil Change',            'Oil Change',           700,  '/media/oil/oil1.jpg',            'Fresh engine oil and a new filter, usually done while you wait.',   '/services/oil',      3],
  ['car-wash',           'Car Wash',              'Car Wash & Detailing', 300,  '/media/car%20wash/wash1.jpg',    'Exterior wash, wheels and tyres, with an optional interior clean.', '/services/car-wash', 4],
];

// Text and pictures for the service details pages (/services/brake-repair ...).
// description, points and gallery: one paragraph / point / picture per line.
const PAGE_TEXT = {
  'engine-diagnostics': {
    intro: "Find out exactly what is wrong with your engine before you spend money fixing it.",
    description: "We use advanced scan tools to read error codes and pinpoint engine performance issues with precision.\nOur certified technicians interpret data to provide transparent repair recommendations and avoid unnecessary costs.\nGet your vehicle back on the road quickly with accurate diagnostics you can trust.",
    points: "Faster problem identification saves time and money\nDetailed reports help you make informed decisions\nPrevent costly breakdowns with early detection",
    gallery: "/media/engine/engine2.jpg\n/media/engine/engine1.jpg\n/media/engine/engine3.jpg",
  },
  'brake-repair': {
    intro: "Safe, quiet and reliable stopping power, checked and repaired by our technicians.",
    description: "We inspect brake pads, discs, calipers and brake fluid to find wear before it becomes dangerous.\nWorn pads and damaged discs are replaced with genuine parts, and every job ends with a road test.\nIf you hear squeaking or grinding, or the pedal feels soft, book a brake check today.",
    points: "Free brake inspection with every booking\nGenuine brake pads and discs\nRoad-tested before you collect your car",
    gallery: "/media/brake/brake1.png\n/media/brake/brake2.jpg\n/media/brake/brake3.jpg",
  },
  'oil-change': {
    intro: "Fresh oil keeps your engine clean, cool and running smoothly.",
    description: "We drain the old oil, replace the oil filter and refill with the right grade of oil for your engine.\nWhile your car is with us, we also check fluid levels, belts and hoses at no extra cost.\nMost oil changes are finished while you wait.",
    points: "Quality engine oil and new filter\nFree fluid level and belt check\nQuick service, usually while you wait",
    gallery: "/media/oil/oil1.jpg\n/media/oil/oil2.jpg\n/media/oil/oil3.jpg",
  },
  'car-wash': {
    intro: "A spotless car inside and out, cleaned with care.",
    description: "Our team washes the body, wheels and tyres with car-safe shampoo and microfibre cloths.\nChoose an interior clean as well to vacuum the seats and carpets and wipe down the dashboard.\nYour car comes back shining and ready for the road.",
    points: "Exterior wash with car-safe shampoo\nWheel and tyre cleaning\nOptional interior vacuum and wipe-down",
    gallery: "/media/car%20wash/wash1.jpg\n/media/car%20wash/wash2.jpg\n/media/car%20wash/wash3.jpg",
  },
};

// Workshop-only services: not shown on the website (active = 0), but admins and mechanics
// can pick them for repair jobs. The price is only a starting cost that can be changed per job.
const WORKSHOP_SERVICES = [
  ['wheel-alignment',     'Wheel Alignment',     'Wheel Alignment',     1500, 10],
  ['battery-replacement', 'Battery Replacement', 'Battery Replacement', 500,  11],
  ['ac-service',          'AC Service',          'AC Service',          2200, 12],
  ['general-service',     'General Service',     'General Service',     5000, 13],
  ['body-paint',          'Body & Paint',        'Body & Paint',        3000, 14],
  ['general-labour',      'General Labour',      'General Labour',      500,  15],
];

// End date for the starting offer: 30 days from today
function inDays(n) {
  const d = new Date(Date.now() + n * 86400000);
  return d.toISOString().slice(0, 10);
}

const OFFERS = [
  // tag,                  title,                   percent, text,                                            points (one per line),                                              service,        picture,              end date
  ['Limited time offer', 'Brake Pad Replacement', 20, 'Free inspection included with every booking.', '20% off brake pads\nFree inspection\nBook online in minutes', 'brake-repair', '/media/banner1.jpg', inDays(30)],
];

// Pictures for the shop products (sku → picture). These products are shown in the shop.
const SHOP_IMAGES = {
  'engine-oil': '/media/oil/oil2.jpg',
  'brake-pads': '/media/brake/brake2.jpg',
  'lubricants': '/media/oil/oil3.jpg',
  'battery': '/media/accessories/batteries.jpg',
  'tires': '/media/accessories/tire.jpg',
  'spark-plugs': '/media/accessories/spake%20plug.jpg',
  'seat-covers': '/media/accessories/seat%20covers.jpg',
  'phone-holder': '/media/accessories/phone%20holder.jpg',
  'dash-camera': '/media/accessories/desh%20carmer.jpg',
  'car-perfume': '/media/accessories/car%20perform.jpg',
  'speakers': '/media/accessories/speaker.jpg',
  'alloy-wheels': '/media/accessories/alloy%20wheel.jpg',
  'car-shampoo': '/media/cleaning/carshampoo.jpg',
  'wax-polish': '/media/accessories/wax.jpg',
  'tire-cleaner': '/media/cleaning/tirecleanser.jpg',
  'interior-spray': '/media/accessories/interior%20Spray.jpg',
  'microfiber': '/media/accessories/microfiber.jpg',
  'jumper-cables': '/media/accessories/jumper%20cable.jpg',
  'tire-inflator': '/media/accessories/tire%20inflator.jpg',
  'tool-kit': '/media/accessories/tool%20kit.jpg',
  'first-aid': '/media/accessories/first%20aid%20kit.jpg',
};

// ---------- helpers ----------

// Does this table already have this column? (works on MariaDB/XAMPP and MySQL/Aiven)
async function hasColumn(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]);
  return rows[0].n > 0;
}

async function setupContent(conn = db, { reset = false } = {}) {
  // 1. tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug varchar(60) NOT NULL UNIQUE,
      title varchar(100) NOT NULL,
      serviceName varchar(100) NOT NULL,
      price decimal(10,2) DEFAULT 0.00,
      image varchar(200) DEFAULT NULL,
      shortText varchar(255) DEFAULT NULL,
      page varchar(100) DEFAULT NULL,
      sortOrder int(11) DEFAULT 0,
      active tinyint(1) DEFAULT 1,
      intro varchar(255) DEFAULT NULL,
      description text DEFAULT NULL,
      points text DEFAULT NULL,
      gallery text DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS offers (
      id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tag varchar(60) DEFAULT 'Limited time offer',
      title varchar(120) NOT NULL,
      percent int(11) DEFAULT 0,
      text varchar(255) DEFAULT NULL,
      points text DEFAULT NULL,
      serviceSlug varchar(60) DEFAULT NULL,
      image varchar(200) DEFAULT NULL,
      endDate date DEFAULT NULL,
      active tinyint(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // 2. new columns: details-page text for services, picture + shop switch for inventory
  for (const [col, type] of [['intro', 'varchar(255)'], ['description', 'text'], ['points', 'text'], ['gallery', 'text']]) {
    if (!(await hasColumn('services', col))) {
      await conn.query(`ALTER TABLE services ADD COLUMN ${col} ${type} DEFAULT NULL`);
    }
  }
  if (!(await hasColumn('inventory', 'image'))) {
    await conn.query('ALTER TABLE inventory ADD COLUMN image varchar(200) DEFAULT NULL');
  }
  if (!(await hasColumn('inventory', 'inShop'))) {
    await conn.query('ALTER TABLE inventory ADD COLUMN inShop tinyint(1) DEFAULT 0');
  }

  // 3. starting content (only when the table is empty, or when reset is asked for)
  if (reset) await conn.query('DROP TABLE IF EXISTS settings');
  await setupSettings(conn);
  if (reset) {
    await conn.query('DELETE FROM services');
    await conn.query('DELETE FROM offers');
  }
  const [[s]] = await conn.query('SELECT COUNT(*) AS n FROM services');
  if (s.n === 0) {
    for (const row of SERVICES) {
      await conn.query(
        'INSERT INTO services (slug, title, serviceName, price, image, shortText, page, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', row);
    }
  }
  // workshop-only services: added when that slug is missing
  for (const [slug, title, serviceName, price, sortOrder] of WORKSHOP_SERVICES) {
    const [found] = await conn.query('SELECT id FROM services WHERE slug = ?', [slug]);
    if (found.length === 0) {
      await conn.query(
        'INSERT INTO services (slug, title, serviceName, price, sortOrder, active) VALUES (?, ?, ?, ?, ?, 0)',
        [slug, title, serviceName, price, sortOrder]);
    }
  }
  // details-page text for the 4 website services (only where it is still empty)
  for (const [slug, t] of Object.entries(PAGE_TEXT)) {
    await conn.query(
      'UPDATE services SET intro = ?, description = ?, points = ?, gallery = ? WHERE slug = ? AND description IS NULL',
      [t.intro, t.description, t.points, t.gallery, slug]);
  }
  const [[o]] = await conn.query('SELECT COUNT(*) AS n FROM offers');
  if (o.n === 0) {
    for (const row of OFFERS) {
      await conn.query(
        'INSERT INTO offers (tag, title, percent, text, points, serviceSlug, image, endDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', row);
    }
  }

  // 4. shop products: picture + show in shop (only if no picture was set yet)
  for (const [sku, image] of Object.entries(SHOP_IMAGES)) {
    await conn.query('UPDATE inventory SET image = ?, inShop = 1 WHERE sku = ? AND image IS NULL', [image, sku]);
  }
}

module.exports = { setupContent };

// When run directly:  node content-setup.js
if (require.main === module) {
  setupContent()
    .then(async () => {
      const [[s]] = await db.query('SELECT COUNT(*) AS n FROM services');
      const [[o]] = await db.query('SELECT COUNT(*) AS n FROM offers');
      const [[p]] = await db.query('SELECT COUNT(*) AS n FROM inventory WHERE inShop = 1');
      const [[t]] = await db.query('SELECT COUNT(*) AS n FROM settings');
      console.log(`✅ Website content ready: ${s.n} services, ${o.n} offers, ${p.n} shop products, ${t.n} page settings`);
      await db.end();
    })
    .catch((err) => {
      console.error('❌ Content setup failed:', err.message);
      process.exit(1);
    });
}
