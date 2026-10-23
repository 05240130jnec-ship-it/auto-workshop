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
      { id: 'M-001', name: 'Ugyen Dorji', phone: '+975 17394436', specialization: 'Engine & Diagnostics', experience: 8, status: 'active', email: 'ugyen@autocare.bt', password: 'mech123', photo: '/media/mechanics/ugyen.jpeg', joined: daysAgo(1460) },
      { id: 'M-002', name: 'Pema Lhamo', email: 'pema@autocare.bt', password: 'mech123', phone: '+975 17228811', specialization: 'Brake Systems', experience: 5, status: 'active', joined: daysAgo(900) },
      { id: 'M-003', name: 'Lhamo', email: 'lhamo@autocare.bt', password: 'mech123', phone: '+975 77345566', specialization: 'General Repairs', experience: 3, status: 'active', joined: daysAgo(540) },
      { id: 'M-004', name: 'Tenzin Wangmo', email: 'tenzin@autocare.bt', password: 'mech123', phone: '+975 17661234', specialization: 'Electrical Systems', experience: 6, status: 'leave', joined: daysAgo(1100) },
      { id: 'M-005', name: 'Sangay Tenzin', email: 'sangay@autocare.bt', password: 'mech123', phone: '+975 17998877', specialization: 'Body & Paint', experience: 4, status: 'active', joined: daysAgo(400) }
    ],

    customers: [
      { id: 'C-001', name: 'Karma Dorji', phone: '+975 17394436', email: 'karma@gmail.com', address: 'Motithang, Thimphu', status: 'active', password: 'user123', joined: daysAgo(320) },
      { id: 'C-002', name: 'Sonam Choden', phone: '+975 17123456', email: 'sonamchoden@yahoo.com', address: 'Babesa, Thimphu', status: 'active', password: 'user123', joined: daysAgo(280) },
      { id: 'C-003', name: 'Tshering Wangmo', phone: '+975 17654321', email: 'tshering.w@gmail.com', address: 'Changzamtog, Thimphu', status: 'active', password: 'user123', joined: daysAgo(250) },
      { id: 'C-004', name: 'Pema Wangchuk', phone: '+975 17890123', email: 'pema.wangchuk@druknet.bt', address: 'Olakha, Thimphu', status: 'active', password: 'user123', joined: daysAgo(210) },
      { id: 'C-005', name: 'Kinley Dem', phone: '+975 77112233', email: 'kinleydem@gmail.com', address: 'Dechencholing, Thimphu', status: 'active', password: 'user123', joined: daysAgo(160) },
      { id: 'C-006', name: 'Jigme Namgyel', phone: '+975 17445566', email: 'jigme.n@gmail.com', address: 'Kawajangsa, Thimphu', status: 'active', password: 'user123', joined: daysAgo(120) },
      { id: 'C-007', name: 'Dechen Yangzom', phone: '+975 17778899', email: 'dechen.y@outlook.com', address: 'Taba, Thimphu', status: 'inactive', password: 'user123', joined: daysAgo(95) },
      { id: 'C-008', name: 'Tandin Penjor', phone: '+975 77665544', email: 'tandin.penjor@gmail.com', address: 'Hejo, Thimphu', status: 'active', password: 'user123', joined: daysAgo(30) }
    ],

    repairs: [
      { id: 'ACP-9250', customerId: 'C-008', vehicle: 'Mahindra Scorpio', plate: 'BP-1-C4410', service: 'Wheel Alignment', mechanicId: null, status: 'pending', priority: 'normal', date: daysAgo(0), due: daysAgo(-2), cost: 1500, notes: 'Car pulls to the left at speed.', parts: [], services: [] },
      { id: 'ACP-9249', customerId: 'C-005', vehicle: 'Hyundai Creta', plate: 'BP-1-B7781', service: 'AC Service', mechanicId: null, status: 'pending', priority: 'normal', date: daysAgo(0), due: daysAgo(-1), cost: 2200, notes: 'AC not cooling, gas refill likely.', parts: [], services: [] },
      { id: 'ACP-9248', customerId: 'C-002', vehicle: 'Honda Civic', plate: 'BP-1-A5678', service: 'Brake Service', mechanicId: null, status: 'pending', priority: 'high', date: daysAgo(1), due: daysAgo(0), cost: 4200, notes: 'Grinding noise when braking.', parts: [], services: [] },
      { id: 'ACP-9247', customerId: 'C-001', vehicle: 'Toyota Corolla', plate: 'BP-1-A1234', service: 'Engine Diagnostics', mechanicId: 'M-001', status: 'progress', priority: 'high', date: daysAgo(1), due: daysAgo(-1), cost: 3500, notes: 'Check engine light on, rough idle.', parts: [{ partId: 'P-106', name: 'Air Filter', qty: 1, price: 450, date: daysAgo(0) }], services: [{ name: 'Engine Diagnostics', qty: 1, cost: 1500 }] },
      { id: 'ACP-9246', customerId: 'C-004', vehicle: 'Ford Ranger', plate: 'BP-2-A7721', service: 'General Service', mechanicId: 'M-003', status: 'progress', priority: 'normal', date: daysAgo(2), due: daysAgo(-1), cost: 5500, notes: '60,000 km service.', parts: [], services: [] },
      { id: 'ACP-9245', customerId: 'C-006', vehicle: 'Suzuki Swift', plate: 'BP-1-B3390', service: 'Battery Replacement', mechanicId: 'M-001', status: 'progress', priority: 'urgent', date: daysAgo(2), due: daysAgo(0), cost: 7200, notes: 'Car not starting in the morning.', parts: [], services: [] },
      { id: 'ACP-9244', customerId: 'C-003', vehicle: 'Hyundai i20', plate: 'BP-1-A9012', service: 'Brake Service', mechanicId: 'M-002', status: 'progress', priority: 'normal', date: daysAgo(3), due: daysAgo(-1), cost: 4200, notes: '', parts: [], services: [] },
      { id: 'ACP-9243', customerId: 'C-004', vehicle: 'Toyota Land Cruiser', plate: 'BP-1-C1122', service: 'Oil Change', mechanicId: 'M-003', status: 'complete', priority: 'normal', date: daysAgo(4), due: daysAgo(3), cost: 2600, notes: '', parts: [], services: [] },
      { id: 'ACP-9242', customerId: 'C-001', vehicle: 'Toyota Corolla', plate: 'BP-1-A1234', service: 'Car Wash & Detailing', mechanicId: 'M-005', status: 'complete', priority: 'normal', date: daysAgo(6), due: daysAgo(6), cost: 1200, notes: '', parts: [], services: [] },
      { id: 'ACP-9241', customerId: 'C-007', vehicle: 'Maruti Alto', plate: 'BP-1-B5512', service: 'General Service', mechanicId: 'M-003', status: 'cancelled', priority: 'normal', date: daysAgo(8), due: daysAgo(6), cost: 0, notes: 'Customer cancelled by phone.', parts: [], services: [] },
      { id: 'ACP-9240', customerId: 'C-002', vehicle: 'Honda Civic', plate: 'BP-1-A5678', service: 'Oil Change', mechanicId: 'M-002', status: 'complete', priority: 'normal', date: daysAgo(10), due: daysAgo(10), cost: 2400, notes: '', parts: [], services: [] },
      { id: 'ACP-9239', customerId: 'C-003', vehicle: 'Hyundai i20', plate: 'BP-1-A9012', service: 'AC Service', mechanicId: 'M-004', status: 'complete', priority: 'normal', date: daysAgo(13), due: daysAgo(12), cost: 2200, notes: '', parts: [], services: [] },
      { id: 'ACP-9238', customerId: 'C-005', vehicle: 'Hyundai Creta', plate: 'BP-1-B7781', service: 'Engine Diagnostics', mechanicId: 'M-001', status: 'complete', priority: 'high', date: daysAgo(20), due: daysAgo(18), cost: 8900, notes: 'Replaced ignition coil.', parts: [{ partId: 'P-104', name: 'Spark Plugs (set of 4)', qty: 1, price: 350, date: daysAgo(19) }], services: [] },
      { id: 'ACP-9237', customerId: 'C-006', vehicle: 'Suzuki Swift', plate: 'BP-1-B3390', service: 'Brake Service', mechanicId: 'M-002', status: 'complete', priority: 'normal', date: daysAgo(34), due: daysAgo(33), cost: 4200, notes: '', parts: [], services: [] },
      { id: 'ACP-9236', customerId: 'C-004', vehicle: 'Ford Ranger', plate: 'BP-2-A7721', service: 'Wheel Alignment', mechanicId: 'M-003', status: 'complete', priority: 'normal', date: daysAgo(41), due: daysAgo(41), cost: 1500, notes: '', parts: [], services: [] },
      { id: 'ACP-9235', customerId: 'C-001', vehicle: 'Toyota Hilux', plate: 'BP-1-C2020', service: 'General Service', mechanicId: 'M-001', status: 'complete', priority: 'normal', date: daysAgo(52), due: daysAgo(51), cost: 6800, notes: '', parts: [], services: [] },
      { id: 'ACP-9234', customerId: 'C-003', vehicle: 'Hyundai i20', plate: 'BP-1-A9012', service: 'Car Wash & Detailing', mechanicId: 'M-005', status: 'complete', priority: 'normal', date: daysAgo(66), due: daysAgo(66), cost: 1200, notes: '', parts: [], services: [] },
      { id: 'ACP-9233', customerId: 'C-002', vehicle: 'Honda Civic', plate: 'BP-1-A5678', service: 'Battery Replacement', mechanicId: 'M-004', status: 'complete', priority: 'urgent', date: daysAgo(78), due: daysAgo(78), cost: 7200, notes: '', parts: [], services: [] },
      { id: 'ACP-9232', customerId: 'C-004', vehicle: 'Toyota Land Cruiser', plate: 'BP-1-C1122', service: 'Engine Diagnostics', mechanicId: 'M-001', status: 'complete', priority: 'high', date: daysAgo(95), due: daysAgo(93), cost: 12500, notes: 'Timing belt replaced.', parts: [], services: [] },
      { id: 'ACP-9231', customerId: 'C-007', vehicle: 'Maruti Alto', plate: 'BP-1-B5512', service: 'Brake Service', mechanicId: 'M-002', status: 'complete', priority: 'normal', date: daysAgo(104), due: daysAgo(104), cost: 3800, notes: '', parts: [], services: [] },
      { id: 'ACP-9230', customerId: 'C-005', vehicle: 'Hyundai Creta', plate: 'BP-1-B7781', service: 'Oil Change', mechanicId: 'M-003', status: 'complete', priority: 'normal', date: daysAgo(118), due: daysAgo(118), cost: 2600, notes: '', parts: [], services: [] },
      { id: 'ACP-9229', customerId: 'C-001', vehicle: 'Toyota Corolla', plate: 'BP-1-A1234', service: 'AC Service', mechanicId: 'M-004', status: 'complete', priority: 'normal', date: daysAgo(132), due: daysAgo(131), cost: 2200, notes: '', parts: [], services: [] },
      { id: 'ACP-9228', customerId: 'C-006', vehicle: 'Suzuki Swift', plate: 'BP-1-B3390', service: 'General Service', mechanicId: 'M-003', status: 'complete', priority: 'normal', date: daysAgo(146), due: daysAgo(145), cost: 5200, notes: '', parts: [], services: [] },
      { id: 'ACP-9227', customerId: 'C-003', vehicle: 'Hyundai i20', plate: 'BP-1-A9012', service: 'Engine Diagnostics', mechanicId: 'M-001', status: 'complete', priority: 'normal', date: daysAgo(160), due: daysAgo(158), cost: 6400, notes: '', parts: [], services: [] },
      { id: 'ACP-9226', customerId: 'C-002', vehicle: 'Honda Civic', plate: 'BP-1-A5678', service: 'Wheel Alignment', mechanicId: 'M-002', status: 'complete', priority: 'normal', date: daysAgo(171), due: daysAgo(171), cost: 1500, notes: '' , parts: [], services: [] }
    ],

    reservations: [], // parts customers ordered from the shop (pay at pickup)
    listings: [],     // parts customers want to sell (admin reviews them)

    orders: [
      { id: 'PO-2216', partId: 'P-107', qty: 10, supplierId: 'S-02', requestedBy: 'M-002', status: 'pending', date: daysAgo(0), note: 'Out of stock — needed for 2 brake jobs.' },
      { id: 'PO-2215', partId: 'P-104', qty: 10, supplierId: 'S-03', requestedBy: 'M-001', status: 'pending', date: daysAgo(1), note: '' },
      { id: 'PO-2214', partId: 'P-101', qty: 4, supplierId: 'S-01', requestedBy: 'M-002', status: 'pending', date: daysAgo(1), note: '' },
      { id: 'PO-2213', partId: 'P-102', qty: 12, supplierId: 'S-02', requestedBy: 'M-003', status: 'approved', date: daysAgo(3), note: 'Running low on 5W-30.' },
      { id: 'PO-2212', partId: 'P-103', qty: 10, supplierId: 'S-01', requestedBy: 'M-003', status: 'received', date: daysAgo(9), note: '' },
      { id: 'PO-2211', partId: 'P-114', qty: 6, supplierId: 'S-03', requestedBy: 'admin', status: 'rejected', date: daysAgo(14), note: 'Enough stock for now.' }
    ]
  };
}

module.exports = { buildSeed }
