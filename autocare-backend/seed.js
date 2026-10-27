// seed.js — fills the database with sample data.
// Run with:  node seed.js
// It deletes old data first, so you can run it again any time to reset.

const bcrypt = require('bcrypt');
const db = require('./db');

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
  console.log('Old data removed');

  // ---------- 2. Hash the demo passwords once ----------
  const adminPass = await bcrypt.hash('admin123', 10);
  const mechPass  = await bcrypt.hash('mech123', 10);
  const userPass  = await bcrypt.hash('user123', 10);

  // ---------- 3. Admin ----------
  await db.query('INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)',
    ['admin', 'Admin User', 'admin@autocare.bt', adminPass]);

  // ---------- 4. Suppliers ----------
  const suppliers = [
    ['S-01', 'Choden Auto Parts', 'Choden Wangmo', '+975 17123456', 'sales@chodenauto.bt', 'Norzin Lam, Thimphu'],
    ['S-02', 'Norzin Lam Auto', 'Kinley Tshering', '+975 17654321', 'norzinauto@gmail.com', 'Norzin Lam, Thimphu'],
    ['S-03', 'Tashi Auto Traders', 'Tashi Phuntsho', '+975 17890123', 'tashiauto@druknet.bt', 'Phuentsholing'],
    ['S-04', 'Druk Supplies', 'Dechen Pelden', '+975 77221144', 'info@druksupplies.bt', 'Changzamtog, Thimphu'],
    ['S-05', 'SafeGuard Bhutan', 'Namgay Dorji', '+975 17556677', 'safeguard.bt@gmail.com', 'Olakha, Thimphu']
  ];
  for (const s of suppliers)
    await db.query('INSERT INTO suppliers (id, name, person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)', s);

  // ---------- 5. Inventory ----------
  const parts = [
    ['P-101', 'BRK-FR-01', 'Brake Pads (Front)', 'Auto Parts', 12, 6, 1800, 'S-01'],
    ['P-102', 'OIL-5W30-5L', 'Engine Oil 5W-30 (5L)', 'Auto Parts', 3, 8, 1000, 'S-02'],
    ['P-103', 'FLT-OIL-01', 'Oil Filter', 'Auto Parts', 18, 10, 140, 'S-01'],
    ['P-104', 'SPK-NGK-04', 'Spark Plugs (set of 4)', 'Auto Parts', 2, 5, 350, 'S-03'],
    ['P-105', 'BAT-12V-65', 'Car Battery 12V 65Ah', 'Auto Parts', 5, 3, 6500, 'S-03'],
    ['P-106', 'FLT-AIR-02', 'Air Filter', 'Auto Parts', 9, 6, 450, 'S-01'],
    ['P-107', 'BRK-FLD-1L', 'Brake Fluid DOT4 (1L)', 'Auto Parts', 0, 4, 520, 'S-02'],
    ['P-108', 'CLN-SHMP-1L', 'Car Shampoo (1L)', 'Cleaning', 25, 10, 350, 'S-04'],
    ['P-109', 'CLN-TIRE-01', 'Tire Cleanser', 'Cleaning', 14, 6, 420, 'S-04'],
    ['P-110', 'CLN-MCF-03', 'Microfiber Cloth (3 pack)', 'Cleaning', 30, 12, 280, 'S-04'],
    ['P-111', 'SAF-FEX-2KG', 'Fire Extinguisher 2kg', 'Safety', 8, 4, 1500, 'S-05'],
    ['P-112', 'SAF-FAK-01', 'First Aid Kit', 'Safety', 4, 5, 900, 'S-05'],
    ['P-113', 'ACC-JMP-01', 'Jumper Cables', 'Accessories', 7, 3, 1200, 'S-03'],
    ['P-114', 'ACC-INF-01', 'Tire Inflator', 'Accessories', 6, 3, 2800, 'S-03'],
        // Shop products (sku = the shop page "slug", so the website can find them)
    ['P-201', 'engine-oil', 'Engine Oil', 'Auto Parts', 20, 5, 1000, 'S-01'],
    ['P-202', 'brake-pads', 'Brake Pads', 'Auto Parts', 20, 5, 1800, 'S-01'],
    ['P-203', 'lubricants', 'Lubricants', 'Auto Parts', 20, 5, 1000, 'S-01'],
    ['P-204', 'battery', 'Batteries', 'Auto Parts', 20, 5, 4500, 'S-01'],
    ['P-205', 'tires', 'Tires', 'Auto Parts', 20, 5, 3500, 'S-01'],
    ['P-206', 'spark-plugs', 'Spark Plugs', 'Auto Parts', 20, 5, 350, 'S-01'],
    ['P-207', 'seat-covers', 'Seat Covers', 'Car Accessories', 20, 5, 3500, 'S-03'],
    ['P-208', 'phone-holder', 'Phone Holders', 'Car Accessories', 20, 5, 800, 'S-03'],
    ['P-209', 'dash-camera', 'Dash Cameras', 'Car Accessories', 20, 5, 4500, 'S-03'],
    ['P-210', 'car-perfume', 'Car Perfumes', 'Car Accessories', 20, 5, 500, 'S-03'],
    ['P-211', 'speakers', 'Speakers', 'Car Accessories', 20, 5, 2800, 'S-03'],
    ['P-212', 'alloy-wheels', 'Alloy Wheels', 'Car Accessories', 20, 5, 8500, 'S-03'],
    ['P-213', 'car-shampoo', 'Car Shampoo', 'Cleaning Products', 20, 5, 350, 'S-04'],
    ['P-214', 'wax-polish', 'Wax / Polish', 'Cleaning Products', 20, 5, 600, 'S-04'],
    ['P-215', 'tire-cleaner', 'Tire Cleaner', 'Cleaning Products', 20, 5, 400, 'S-04'],
    ['P-216', 'interior-spray', 'Interior Spray', 'Cleaning Products', 20, 5, 450, 'S-04'],
    ['P-217', 'microfiber', 'Microfiber Cloth', 'Cleaning Products', 20, 5, 150, 'S-04'],
    ['P-218', 'jumper-cables', 'Jumper Cables', 'Emergency & Safety', 20, 5, 900, 'S-05'],
    ['P-219', 'tire-inflator', 'Tire Inflator', 'Emergency & Safety', 20, 5, 2200, 'S-05'],
    ['P-220', 'tool-kit', 'Tool Kits', 'Emergency & Safety', 20, 5, 4000, 'S-05'],
    ['P-221', 'first-aid', 'First Aid Kit', 'Emergency & Safety', 20, 5, 1200, 'S-05']
  ];
  for (const p of parts)
    await db.query('INSERT INTO inventory (id, sku, name, category, stock, reorder, price, supplierId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p);

  // ---------- 6. Mechanics ----------
  const mechanics = [
    ['M-001', 'Ugyen Dorji', 'ugyen@autocare.bt', '+975 17394436', 'Engine & Diagnostics', 8, 'active', '/media/mechanics/ugyen.jpeg', daysAgo(1460)],
    ['M-002', 'Pema Lhamo', 'pema@autocare.bt', '+975 17228811', 'Brake Systems', 5, 'active', null, daysAgo(900)],
    ['M-003', 'Lhamo', 'lhamo@autocare.bt', '+975 77345566', 'General Repairs', 3, 'active', null, daysAgo(540)],
    ['M-004', 'Tenzin Wangmo', 'tenzin@autocare.bt', '+975 17661234', 'Electrical Systems', 6, 'leave', null, daysAgo(1100)],
    ['M-005', 'Sangay Tenzin', 'sangay@autocare.bt', '+975 17998877', 'Body & Paint', 4, 'active', null, daysAgo(400)]
  ];
  for (const m of mechanics)
    await db.query(
      'INSERT INTO mechanics (id, name, email, phone, specialization, experience, status, photo, joined, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [...m, mechPass]);

  // ---------- 7. Customers ----------
  const customers = [
    ['C-001', 'Karma Dorji', 'karma@gmail.com', '+975 17394436', 'Motithang, Thimphu', 'active', daysAgo(320)],
    ['C-002', 'Sonam Choden', 'sonamchoden@yahoo.com', '+975 17123456', 'Babesa, Thimphu', 'active', daysAgo(280)],
    ['C-003', 'Tshering Wangmo', 'tshering.w@gmail.com', '+975 17654321', 'Changzamtog, Thimphu', 'active', daysAgo(250)],
    ['C-004', 'Pema Wangchuk', 'pema.wangchuk@druknet.bt', '+975 17890123', 'Olakha, Thimphu', 'active', daysAgo(210)],
    ['C-005', 'Kinley Dem', 'kinleydem@gmail.com', '+975 77112233', 'Dechencholing, Thimphu', 'active', daysAgo(160)],
    ['C-006', 'Jigme Namgyel', 'jigme.n@gmail.com', '+975 17445566', 'Kawajangsa, Thimphu', 'active', daysAgo(120)],
    ['C-007', 'Dechen Yangzom', 'dechen.y@outlook.com', '+975 17778899', 'Taba, Thimphu', 'inactive', daysAgo(95)],
    ['C-008', 'Tandin Penjor', 'tandin.penjor@gmail.com', '+975 77665544', 'Hejo, Thimphu', 'active', daysAgo(30)]
  ];
  for (const c of customers)
    await db.query(
      'INSERT INTO customers (id, name, email, phone, address, status, joined, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [...c, userPass]);

  // ---------- 8. Repairs ----------
  // [id, customer, vehicle, plate, service, mechanic, status, priority, date, due, cost, notes]
  const repairs = [
    ['ACP-9250', 'C-008', 'Mahindra Scorpio', 'BP-1-C4410', 'Wheel Alignment', null, 'pending', 'normal', 0, -2, 1500, 'Car pulls to the left at speed.'],
    ['ACP-9249', 'C-005', 'Hyundai Creta', 'BP-1-B7781', 'AC Service', null, 'pending', 'normal', 0, -1, 2200, 'AC not cooling, gas refill likely.'],
    ['ACP-9248', 'C-002', 'Honda Civic', 'BP-1-A5678', 'Brake Service', null, 'pending', 'high', 1, 0, 4200, 'Grinding noise when braking.'],
    ['ACP-9247', 'C-001', 'Toyota Corolla', 'BP-1-A1234', 'Engine Diagnostics', 'M-001', 'progress', 'high', 1, -1, 3500, 'Check engine light on, rough idle.'],
    ['ACP-9246', 'C-004', 'Ford Ranger', 'BP-2-A7721', 'General Service', 'M-003', 'progress', 'normal', 2, -1, 5500, '60,000 km service.'],
    ['ACP-9245', 'C-006', 'Suzuki Swift', 'BP-1-B3390', 'Battery Replacement', 'M-001', 'progress', 'urgent', 2, 0, 7200, 'Car not starting in the morning.'],
    ['ACP-9244', 'C-003', 'Hyundai i20', 'BP-1-A9012', 'Brake Service', 'M-002', 'progress', 'normal', 3, -1, 4200, ''],
    ['ACP-9243', 'C-004', 'Toyota Land Cruiser', 'BP-1-C1122', 'Oil Change', 'M-003', 'complete', 'normal', 4, 3, 2600, ''],
    ['ACP-9242', 'C-001', 'Toyota Corolla', 'BP-1-A1234', 'Car Wash & Detailing', 'M-005', 'complete', 'normal', 6, 6, 1200, ''],
    ['ACP-9241', 'C-007', 'Maruti Alto', 'BP-1-B5512', 'General Service', 'M-003', 'cancelled', 'normal', 8, 6, 0, 'Customer cancelled by phone.'],
    ['ACP-9240', 'C-002', 'Honda Civic', 'BP-1-A5678', 'Oil Change', 'M-002', 'complete', 'normal', 10, 10, 2400, ''],
    ['ACP-9239', 'C-003', 'Hyundai i20', 'BP-1-A9012', 'AC Service', 'M-004', 'complete', 'normal', 13, 12, 2200, ''],
    ['ACP-9238', 'C-005', 'Hyundai Creta', 'BP-1-B7781', 'Engine Diagnostics', 'M-001', 'complete', 'high', 20, 18, 8900, 'Replaced ignition coil.'],
    ['ACP-9237', 'C-006', 'Suzuki Swift', 'BP-1-B3390', 'Brake Service', 'M-002', 'complete', 'normal', 34, 33, 4200, ''],
    ['ACP-9236', 'C-004', 'Ford Ranger', 'BP-2-A7721', 'Wheel Alignment', 'M-003', 'complete', 'normal', 41, 41, 1500, ''],
    ['ACP-9235', 'C-001', 'Toyota Hilux', 'BP-1-C2020', 'General Service', 'M-001', 'complete', 'normal', 52, 51, 6800, ''],
    ['ACP-9234', 'C-003', 'Hyundai i20', 'BP-1-A9012', 'Car Wash & Detailing', 'M-005', 'complete', 'normal', 66, 66, 1200, ''],
    ['ACP-9233', 'C-002', 'Honda Civic', 'BP-1-A5678', 'Battery Replacement', 'M-004', 'complete', 'urgent', 78, 78, 7200, ''],
    ['ACP-9232', 'C-004', 'Toyota Land Cruiser', 'BP-1-C1122', 'Engine Diagnostics', 'M-001', 'complete', 'high', 95, 93, 12500, 'Timing belt replaced.'],
    ['ACP-9231', 'C-007', 'Maruti Alto', 'BP-1-B5512', 'Brake Service', 'M-002', 'complete', 'normal', 104, 104, 3800, ''],
    ['ACP-9230', 'C-005', 'Hyundai Creta', 'BP-1-B7781', 'Oil Change', 'M-003', 'complete', 'normal', 118, 118, 2600, ''],
    ['ACP-9229', 'C-001', 'Toyota Corolla', 'BP-1-A1234', 'AC Service', 'M-004', 'complete', 'normal', 132, 131, 2200, ''],
    ['ACP-9228', 'C-006', 'Suzuki Swift', 'BP-1-B3390', 'General Service', 'M-003', 'complete', 'normal', 146, 145, 5200, ''],
    ['ACP-9227', 'C-003', 'Hyundai i20', 'BP-1-A9012', 'Engine Diagnostics', 'M-001', 'complete', 'normal', 160, 158, 6400, ''],
    ['ACP-9226', 'C-002', 'Honda Civic', 'BP-1-A5678', 'Wheel Alignment', 'M-002', 'complete', 'normal', 171, 171, 1500, '']
  ];
  for (const r of repairs) {
    const [id, cust, vehicle, plate, service, mech, status, priority, d, due, cost, notes] = r;
    await db.query(
      `INSERT INTO repairs (id, customerId, vehicle, plate, service, mechanicId, status, priority, date, due, cost, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, cust, vehicle, plate, service, mech, status, priority, daysAgo(d), daysAgo(due), cost, notes]);
  }

  // Parts and services already logged on some repairs
  await db.query('INSERT INTO repair_parts (repairId, partId, name, qty, price, date) VALUES (?, ?, ?, ?, ?, ?)',
    ['ACP-9247', 'P-106', 'Air Filter', 1, 450, daysAgo(0)]);
  await db.query('INSERT INTO repair_parts (repairId, partId, name, qty, price, date) VALUES (?, ?, ?, ?, ?, ?)',
    ['ACP-9238', 'P-104', 'Spark Plugs (set of 4)', 1, 350, daysAgo(19)]);
  await db.query('INSERT INTO repair_services (repairId, name, qty, cost) VALUES (?, ?, ?, ?)',
    ['ACP-9247', 'Engine Diagnostics', 1, 1500]);

  // ---------- 9. Purchase orders ----------
  const orders = [
    ['PO-2216', 'P-107', 10, 'S-02', 'M-002', 'pending', 0, 'Out of stock — needed for 2 brake jobs.'],
    ['PO-2215', 'P-104', 10, 'S-03', 'M-001', 'pending', 1, ''],
    ['PO-2214', 'P-101', 4, 'S-01', 'M-002', 'pending', 1, ''],
    ['PO-2213', 'P-102', 12, 'S-02', 'M-003', 'approved', 3, 'Running low on 5W-30.'],
    ['PO-2212', 'P-103', 10, 'S-01', 'M-003', 'received', 9, ''],
    ['PO-2211', 'P-114', 6, 'S-03', 'admin', 'rejected', 14, 'Enough stock for now.']
  ];
  for (const o of orders) {
    const [id, partId, qty, supplierId, requestedBy, status, d, note] = o;
    await db.query(
      'INSERT INTO orders (id, partId, qty, supplierId, requestedBy, status, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, partId, qty, supplierId, requestedBy, status, daysAgo(d), note]);
  }

    console.log(`✅ Sample data added: 1 admin, ${mechanics.length} mechanics, ${customers.length} customers, ` +
    `${suppliers.length} suppliers, ${parts.length} parts, ${repairs.length} repairs, ${orders.length} orders`);
  await db.end();   // close the connection so the script finishes
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});