// AutoCare Pro — sample data used by setup-db.js to fill the MySQL tables.
// (Same data as autocare-react/src/data/seed.js.)
// Dates are relative to today so the dashboards always look "live".
function buildSeed(daysAgo) {
  return {
    suppliers: [
      { id: 'S-01', name: 'Choden Auto Parts', person: 'Choden Wangmo', phone: '+975 17123456', email: 'sales@chodenauto.bt', address: 'Norzin Lam, Thimphu' },
      { id: 'S-02', name: 'Norzin Lam Auto', person: 'Kinley Tshering', phone: '+975 17654321', email: 'norzinauto@gmail.com', address: 'Norzin Lam, Thimphu' },
      { id: 'S-03', name: 'Tashi Auto Traders', person: 'Tashi Phuntsho', phone: '+975 17890123', email: 'tashiauto@druknet.bt', address: 'Phuentsholing' },
      { id: 'S-04', name: 'Druk Supplies', person: 'Dechen Pelden', phone: '+975 77221144', email: 'info@druksupplies.bt', address: 'Changzamtog, Thimphu' },
      { id: 'S-05', name: 'SafeGuard Bhutan', person: 'Namgay Dorji', phone: '+975 17556677', email: 'safeguard.bt@gmail.com', address: 'Olakha, Thimphu' }
    ],

    inventory: [
      { id: 'P-101', sku: 'BRK-FR-01', name: 'Brake Pads (Front)', category: 'Auto Parts', stock: 12, reorder: 6, price: 1800, supplierId: 'S-01' },
      { id: 'P-102', sku: 'OIL-5W30-5L', name: 'Engine Oil 5W-30 (5L)', category: 'Auto Parts', stock: 3, reorder: 8, price: 1000, supplierId: 'S-02' },
      { id: 'P-103', sku: 'FLT-OIL-01', name: 'Oil Filter', category: 'Auto Parts', stock: 18, reorder: 10, price: 140, supplierId: 'S-01' },
      { id: 'P-104', sku: 'SPK-NGK-04', name: 'Spark Plugs (set of 4)', category: 'Auto Parts', stock: 2, reorder: 5, price: 350, supplierId: 'S-03' },
      { id: 'P-105', sku: 'BAT-12V-65', name: 'Car Battery 12V 65Ah', category: 'Auto Parts', stock: 5, reorder: 3, price: 6500, supplierId: 'S-03' },
      { id: 'P-106', sku: 'FLT-AIR-02', name: 'Air Filter', category: 'Auto Parts', stock: 9, reorder: 6, price: 450, supplierId: 'S-01' },
      { id: 'P-107', sku: 'BRK-FLD-1L', name: 'Brake Fluid DOT4 (1L)', category: 'Auto Parts', stock: 0, reorder: 4, price: 520, supplierId: 'S-02' },
      { id: 'P-108', sku: 'CLN-SHMP-1L', name: 'Car Shampoo (1L)', category: 'Cleaning', stock: 25, reorder: 10, price: 350, supplierId: 'S-04' },
      { id: 'P-109', sku: 'CLN-TIRE-01', name: 'Tire Cleanser', category: 'Cleaning', stock: 14, reorder: 6, price: 420, supplierId: 'S-04' },
      { id: 'P-110', sku: 'CLN-MCF-03', name: 'Microfiber Cloth (3 pack)', category: 'Cleaning', stock: 30, reorder: 12, price: 280, supplierId: 'S-04' },
      { id: 'P-111', sku: 'SAF-FEX-2KG', name: 'Fire Extinguisher 2kg', category: 'Safety', stock: 8, reorder: 4, price: 1500, supplierId: 'S-05' },
      { id: 'P-112', sku: 'SAF-FAK-01', name: 'First Aid Kit', category: 'Safety', stock: 4, reorder: 5, price: 900, supplierId: 'S-05' },
      { id: 'P-113', sku: 'ACC-JMP-01', name: 'Jumper Cables', category: 'Accessories', stock: 7, reorder: 3, price: 1200, supplierId: 'S-03' },
      { id: 'P-114', sku: 'ACC-INF-01', name: 'Tire Inflator', category: 'Accessories', stock: 6, reorder: 3, price: 2800, supplierId: 'S-03' }
    ],

    mechanics: [
      { id: 'M-001', name: 'Ugyen Dorji', phone: '+975 17394436', specialization: 'Engine & Diagnostics', experience: 8, status: 'active', email: 'ugyen@autocare.bt', password: 'mech123', photo: '/media/mechanics/ugyen.jpeg', joined: daysAgo(1460) }
    ],

    customers: [
      { id: 'C-001', name: 'Karma Dorji', phone: '+975 17394436', email: 'karma@gmail.com', address: 'Motithang, Thimphu', status: 'active', password: 'user123', joined: daysAgo(320) }
    ],

    repairs: [], // no sample jobs: book your own as Karma to test

    reservations: [], // parts customers ordered from the shop (pay at pickup)
    listings: [],     // parts customers want to sell (admin reviews them)

    orders: [] // no sample purchase orders
  };
}

module.exports = { buildSeed }
