// controllers/adminController.js — everything on the admin pages:
// dashboard, repairs, mechanics, customers, inventory, suppliers, purchase orders,
// shop listings + reservations, and the admin's own profile.

const bcrypt = require('bcrypt');
const Repair = require('../models/repairModel');
const Mechanic = require('../models/mechanicModel');
const Customer = require('../models/customerModel');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Inventory = require('../models/inventoryModel');
const Supplier = require('../models/supplierModel');
const Order = require('../models/orderModel');
const Listing = require('../models/listingModel');
const Reservation = require('../models/reservationModel');
const { onlyFields } = require('../models/helpers');
const { checkVehicleType } = require('../models/settingsModel');
const { cleanPlate, cleanVehicle, PLATE_ERROR, VEHICLE_ERROR } = require('../utils/vehicle-rules');

const today = () => new Date().toISOString().slice(0, 10);

// ---------- DASHBOARD ----------

// GET /api/admin/dashboard  -> numbers for the admin home page
async function dashboard(req, res) {
  const repairs = await Repair.countByStatus();
  const activeCustomers = await Customer.countActive();
  const availableMechanics = await Mechanic.countAvailable();
  const lowStockParts = await Inventory.countLow();
  const revenue = await Repair.revenue();
  const listingsToReview = await Listing.countInReview();
  const pendingOrders = await Order.countPending();
  res.json({ repairs, activeCustomers, availableMechanics, lowStockParts, revenue, listingsToReview, pendingOrders });
}

// ---------- REPAIRS ----------

// GET /api/admin/repairs   (?status=pending -> only pending)
async function listRepairs(req, res) {
  res.json(await Repair.findAll(req.query.status));
}

// GET /api/admin/repairs/ACP-9247  -> one repair with its parts and services
async function getRepair(req, res) {
  const repair = await Repair.findOneForAdmin(req.params.id);
  if (!repair) return res.status(404).json({ error: 'Repair not found.' });
  const parts = await Repair.findParts(req.params.id);
  const services = await Repair.findServices(req.params.id);
  res.json({ ...repair, parts, services });
}

// PATCH /api/admin/repairs/ACP-9250  -> assign mechanic, change status, priority, due date, cost
async function updateRepair(req, res) {
  const body = req.body || {};
  const STATUSES = ['pending', 'progress', 'complete', 'cancelled'];
  const PRIORITIES = ['normal', 'high', 'urgent'];

  if (body.status && !STATUSES.includes(body.status)) {
    return res.status(400).json({ error: 'Status must be pending, progress, complete or cancelled.' });
  }
  if (body.priority && !PRIORITIES.includes(body.priority)) {
    return res.status(400).json({ error: 'Priority must be normal, high or urgent.' });
  }
  if (body.mechanicId && !(await Mechanic.exists(body.mechanicId))) {
    return res.status(400).json({ error: 'Mechanic not found.' });
  }
  if (body.customerId && !(await Customer.exists(body.customerId))) {
    return res.status(400).json({ error: 'Customer not found.' });
  }
  if (body.mechanicId === '') body.mechanicId = null;   // "Assign later" in the form
  // Check the car name and the Bhutan plate number when they are changed
  if (body.vehicle !== undefined) {
    body.vehicle = cleanVehicle(body.vehicle);
    if (!body.vehicle) return res.status(400).json({ error: VEHICLE_ERROR });
  }
  if (body.plate !== undefined) {
    body.plate = cleanPlate(body.plate);
    if (!body.plate) return res.status(400).json({ error: PLATE_ERROR });
  }
  // Vehicle type: one of the list, or empty
  if (body.vehicleType !== undefined && body.vehicleType !== '' && body.vehicleType !== null) {
    body.vehicleType = await checkVehicleType(body.vehicleType);
    if (!body.vehicleType) return res.status(400).json({ error: 'Please choose a vehicle type from the list.' });
  }
  if (body.vehicleType === '') body.vehicleType = null;

  // Only these fields can be changed
  const ok = await Repair.update(req.params.id, onlyFields(body, ['customerId', 'vehicleType', 'vehicle', 'plate',
    'service', 'mechanicId', 'status', 'priority', 'date', 'due', 'cost', 'notes']));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Repair not found.' });

  res.json(await Repair.findOneForAdmin(req.params.id));
}

// POST /api/admin/repairs  -> admin creates a job (e.g. a walk-in customer)
async function createRepair(req, res) {
  const b = req.body || {};
  if (!b.customerId || !b.vehicle || !b.plate || !b.service) {
    return res.status(400).json({ error: 'Customer, vehicle, plate and service are required.' });
  }
  const vehicle = cleanVehicle(b.vehicle);
  if (!vehicle) return res.status(400).json({ error: VEHICLE_ERROR });
  const plate = cleanPlate(b.plate);
  if (!plate) return res.status(400).json({ error: PLATE_ERROR });
  let vehicleType = null;                       // optional for the admin
  if (b.vehicleType) {
    vehicleType = await checkVehicleType(b.vehicleType);
    if (!vehicleType) return res.status(400).json({ error: 'Please choose a vehicle type from the list.' });
  }
  if (!(await Customer.exists(b.customerId))) return res.status(400).json({ error: 'Customer not found.' });

  const status = ['pending', 'progress', 'complete', 'cancelled'].includes(b.status) ? b.status : 'pending';
  const priority = ['normal', 'high', 'urgent'].includes(b.priority) ? b.priority : 'normal';
  if (status === 'progress' && !b.mechanicId) {
    return res.status(400).json({ error: 'Assign a mechanic to mark the job In Progress.' });
  }

  const id = await Repair.nextId();
  await Repair.createByAdmin({
    id, customerId: b.customerId, vehicleType, vehicle, plate, service: b.service, mechanicId: b.mechanicId || null,
    status, priority, date: b.date || today(), due: b.due || null, cost: Number(b.cost) || 0, notes: b.notes || '',
  });
  res.status(201).json({ id });
}

// DELETE /api/admin/repairs/ACP-9251  -> remove a job (its parts and services go too)
async function deleteRepair(req, res) {
  if (!(await Repair.remove(req.params.id))) return res.status(404).json({ error: 'Repair not found.' });
  res.json({ deleted: req.params.id });
}

// ---------- MECHANICS ----------

// GET /api/admin/mechanics  -> all mechanics + how many open jobs each has
async function listMechanics(req, res) {
  res.json(await Mechanic.findAllWithOpenJobs());
}

// POST /api/admin/mechanics  -> add a mechanic
async function createMechanic(req, res) {
  const { name, email, phone, password, specialization, experience, status, joined } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (await User.emailTaken(email)) {
    return res.status(409).json({ error: 'This email is already used.' });
  }

  const id = await Mechanic.nextId();
  const hash = await bcrypt.hash(password, 10);
  await Mechanic.create({
    id, name, email: email.toLowerCase(), phone: phone || '', password: hash,
    specialization: specialization || 'General', experience: Number(experience) || 0,
    status: ['active', 'busy', 'leave'].includes(status) ? status : 'active',
    joined: joined || today(),
  });
  res.status(201).json({ id });
}

// PATCH /api/admin/mechanics/M-002  -> edit details or status
async function updateMechanic(req, res) {
  const body = req.body || {};
  if (body.status && !['active', 'busy', 'leave'].includes(body.status)) {
    return res.status(400).json({ error: 'Status must be active, busy or leave.' });
  }
  if (body.email) {
    body.email = body.email.toLowerCase();
    if (await User.emailTaken(body.email, req.params.id)) return res.status(409).json({ error: 'This email is already used.' });
  }
  const ok = await Mechanic.update(req.params.id, onlyFields(body,
    ['name', 'email', 'phone', 'specialization', 'experience', 'status', 'joined']));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Mechanic not found.' });

  res.json(await Mechanic.findById(req.params.id));
}

// DELETE /api/admin/mechanics/M-006  -> remove (their repairs become unassigned)
async function deleteMechanic(req, res) {
  if (!(await Mechanic.remove(req.params.id))) return res.status(404).json({ error: 'Mechanic not found.' });
  res.json({ deleted: req.params.id });
}

// ---------- CUSTOMERS ----------

// GET /api/admin/customers  -> all customers + how many repairs each has
async function listCustomers(req, res) {
  res.json(await Customer.findAllWithRepairCount());
}

// POST /api/admin/customers  -> admin adds a customer (e.g. someone who phoned in)
async function createCustomer(req, res) {
  const { name, email, phone, address, status, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (await User.emailTaken(email.toLowerCase())) {
    return res.status(409).json({ error: 'This email is already used.' });
  }

  const id = await Customer.nextId();
  const hash = await bcrypt.hash(password, 10);
  await Customer.create({
    id, name, email: email.toLowerCase(), phone: phone || null, address: address || null, password: hash,
    status: status === 'inactive' ? 'inactive' : 'active',
  });
  res.status(201).json({ id });
}

// PATCH /api/admin/customers/C-007  -> block / unblock only: { status: 'active' | 'inactive' }
// The admin can SEE a customer's details but cannot change them: only the customer can
// (website → My profile). This protects the customer's data and login.
async function updateCustomer(req, res) {
  const status = (req.body || {}).status;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'The admin can only block or unblock a customer (status active or inactive).' });
  }
  if (!(await Customer.setStatus(req.params.id, status))) return res.status(404).json({ error: 'Customer not found.' });
  res.json(await Customer.findForAdmin(req.params.id));
}

// DELETE /api/admin/customers/C-009  -> only customers with no repairs
// (deleting one with repairs would also delete their service history, so we refuse)
async function deleteCustomer(req, res) {
  if (await Repair.countOfCustomer(req.params.id) > 0) {
    return res.status(409).json({ error: 'This customer has repairs on record. Set them to inactive instead.' });
  }
  if (!(await Customer.remove(req.params.id))) return res.status(404).json({ error: 'Customer not found.' });
  res.json({ deleted: req.params.id });
}

// ---------- INVENTORY ----------

// Part pictures: an uploaded picture ("data:image/…", made small in the browser) or an old path ("/media/…")
function badPartPicture(src) {
  if (!src) return false;
  if (String(src).startsWith('/')) return src.length > 200;
  return !/^data:image\/(jpeg|png|webp);base64,/.test(src) || src.length > 600 * 1024;
}

// GET /api/admin/inventory   (?low=1 -> only parts at or below the reorder level)
async function listInventory(req, res) {
  res.json(await Inventory.findAll(req.query.low));
}

// POST /api/admin/inventory  -> add a part (the SKU is made from the name when it is empty)
async function createPart(req, res) {
  const { name, category, stock, reorder, price, supplierId, image, inShop } = req.body || {};
  if (!name || price === undefined || price === '') {
    return res.status(400).json({ error: 'Name and price are required.' });
  }
  if (badPartPicture(image)) return res.status(400).json({ error: 'The picture is not valid or is too big. Please choose another one.' });
  const sku = String(req.body.sku || '').trim() || await Inventory.freeSku(name, Number(inShop) === 1);

  const id = await Inventory.nextId();
  try {
    await Inventory.create({
      id, sku, name, category: category || 'Other', stock: Number(stock) || 0, reorder: Number(reorder) || 5,
      price, supplierId: supplierId || null, image: image || null, inShop: Number(inShop) ? 1 : 0,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This SKU already exists.' });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Supplier not found.' });
    throw err;
  }
  res.status(201).json({ id });
}

// PATCH /api/admin/inventory/P-101  -> edit price, stock, reorder level...
async function updatePart(req, res) {
  const body = req.body || {};
  if (badPartPicture(body.image)) return res.status(400).json({ error: 'The picture is not valid or is too big. Please choose another one.' });
  if ('sku' in body && !String(body.sku || '').trim()) {          // SKU emptied -> make a new one from the name
    const old = await Inventory.findNameAndShop(req.params.id);
    if (!old) return res.status(404).json({ error: 'Part not found.' });
    body.sku = await Inventory.freeSku(body.name || old.name, Number(body.inShop ?? old.inShop) === 1);
  }
  let ok;
  try {
    ok = await Inventory.update(req.params.id, onlyFields(body,
      ['sku', 'name', 'category', 'stock', 'reorder', 'price', 'supplierId', 'image', 'inShop']));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Another part already uses this SKU.' });
    throw err;
  }
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Part not found.' });

  res.json(await Inventory.findById(req.params.id));
}

// DELETE /api/admin/inventory/P-115
async function deletePart(req, res) {
  try {
    if (!(await Inventory.remove(req.params.id))) return res.status(404).json({ error: 'Part not found.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'This part is used in orders, so it cannot be deleted.' });
    }
    throw err;
  }
  res.json({ deleted: req.params.id });
}

// ---------- SUPPLIERS ----------

// GET /api/admin/suppliers  -> all suppliers + how many parts each supplies
async function listSuppliers(req, res) {
  res.json(await Supplier.findAll());
}

// POST /api/admin/suppliers  -> add a supplier
async function createSupplier(req, res) {
  const { name, person, phone, email, address } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });

  const id = await Supplier.nextId();
  await Supplier.create({ id, name, person: person || '', phone, email: email || '', address: address || '' });
  res.status(201).json({ id });
}

// PATCH /api/admin/suppliers/S-06
async function updateSupplier(req, res) {
  const ok = await Supplier.update(req.params.id, onlyFields(req.body || {},
    ['name', 'person', 'phone', 'email', 'address']));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  if (!ok) return res.status(404).json({ error: 'Supplier not found.' });

  res.json(await Supplier.findById(req.params.id));
}

// DELETE /api/admin/suppliers/S-06
async function deleteSupplier(req, res) {
  try {
    if (!(await Supplier.remove(req.params.id))) return res.status(404).json({ error: 'Supplier not found.' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'This supplier has orders, so it cannot be deleted.' });
    }
    throw err;
  }
  res.json({ deleted: req.params.id });
}

// ---------- PURCHASE ORDERS ----------

// GET /api/admin/orders   (?status=pending works too)
async function listOrders(req, res) {
  res.json(await Order.findAll(req.query.status));
}

// POST /api/admin/orders  -> order more of a part from its supplier
async function createOrder(req, res) {
  const { partId, qty, supplierId, note, requestedBy } = req.body || {};
  if (!partId || !qty) return res.status(400).json({ error: 'Part and quantity are required.' });

  const part = await Inventory.findById(partId);
  if (!part) return res.status(404).json({ error: 'Part not found.' });
  if (!supplierId && !part.supplierId) {
    return res.status(400).json({ error: 'This part has no supplier yet. Edit the part and choose a supplier first.' });
  }

  const id = await Order.nextId();
  // Orders made by the admin are approved straight away; requests "on behalf of" a mechanic wait
  const by = requestedBy || req.user.id;
  const status = by === req.user.id ? 'approved' : 'pending';

  await Order.create({
    id, partId, qty: Number(qty), supplierId: supplierId || part.supplierId, requestedBy: by, status, note: note || '',
  });
  res.status(201).json({ id, status });
}

// PATCH /api/admin/orders/PO-2217  -> approve, reject, or mark received
// pending -> approved or rejected,  approved -> received (stock goes up)
async function updateOrder(req, res) {
  const { status, note } = req.body || {};
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const allowedNext = {
    pending: ['approved', 'rejected'],
    approved: ['received'],
    received: [],
    rejected: []
  };
  if (!allowedNext[order.status].includes(status)) {
    return res.status(400).json({ error: `A ${order.status} order cannot be changed to ${status}.` });
  }

  await Order.setStatus(order.id, status);
  if (note !== undefined) await Order.setNote(order.id, note);
  if (status === 'received') await Inventory.addStock(order.partId, order.qty);

  res.json(await Order.findOne(order.id));
}

// ---------- SHOP: LISTINGS (customers selling parts) ----------

// GET /api/admin/shop/listings   (?status=review -> only ones waiting for a decision)
async function listListings(req, res) {
  res.json(await Listing.findAll(req.query.status));
}

// PATCH /api/admin/shop/listings/L-101  -> approve or reject (only while in review)
async function updateListing(req, res) {
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }
  const current = await Listing.findStatus(req.params.id);
  if (current === undefined) return res.status(404).json({ error: 'Listing not found.' });
  if (current !== 'review') {
    return res.status(400).json({ error: `This listing is already ${current}.` });
  }

  await Listing.setStatus(req.params.id, status);
  res.json({ id: req.params.id, status });
}

// ---------- SHOP: RESERVATIONS (customers reserving workshop parts) ----------

// GET /api/admin/shop/reservations   (?status=ready -> waiting for pickup)
async function listReservations(req, res) {
  res.json(await Reservation.findAll(req.query.status));
}

// PATCH /api/admin/shop/reservations/R-1002  -> collected, or cancelled (stock goes back)
async function updateReservation(req, res) {
  const { status } = req.body || {};
  if (!['collected', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be collected or cancelled.' });
  }
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });
  if (reservation.status !== 'ready') {
    return res.status(400).json({ error: `This reservation is already ${reservation.status}.` });
  }

  await Reservation.setStatus(reservation.id, status);
  if (status === 'cancelled') await Inventory.addStockBySku(reservation.slug, reservation.qty);
  res.json({ id: reservation.id, status });
}

// ---------- MY PROFILE (the admin who is logged in) ----------
// The login email is not changed here.

// GET /api/admin/profile
async function getProfile(req, res) {
  const admin = await Admin.findById(req.user.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });
  res.json(admin);
}

// PATCH /api/admin/profile   { name, phone, photo }   (photo: data:image/… or null)
async function updateProfile(req, res) {
  const body = { ...(req.body || {}) };
  if (body.name !== undefined) {
    body.name = String(body.name).trim().replace(/\s+/g, ' ');
    if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(body.name)) return res.status(400).json({ error: 'Please enter your full name (letters and spaces only).' });
  }
  if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
    body.phone = String(body.phone).replace(/[\s-]/g, '');
    if (!/^(\+?975)?[1-8]\d{7}$/.test(body.phone)) return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  }
  if (body.phone === '') body.phone = null;
  if (body.photo !== undefined && body.photo !== null) {
    if (typeof body.photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(body.photo)) {
      return res.status(400).json({ error: 'Please choose a JPG, PNG or WEBP picture.' });
    }
    if (body.photo.length > 400 * 1024) return res.status(400).json({ error: 'This picture is too big.' });
  }
  const ok = await Admin.update(req.user.id, onlyFields(body, ['name', 'phone', 'photo']));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });
  res.json(await Admin.findById(req.user.id));
}

// PATCH /api/admin/profile/password   { currentPassword, newPassword }
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Enter your current and new password.' });
  if (String(newPassword).length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({ error: 'New password needs at least 8 characters, with a letter and a number.' });
  }
  const hash = await Admin.getPasswordHash(req.user.id);
  if (!hash || !(await bcrypt.compare(currentPassword, hash))) {
    return res.status(401).json({ error: 'Current password is wrong.' });
  }
  await Admin.setPassword(req.user.id, await bcrypt.hash(newPassword, 10));
  res.json({ message: 'Password changed.' });
}

module.exports = {
  dashboard,
  listRepairs, getRepair, updateRepair, createRepair, deleteRepair,
  listMechanics, createMechanic, updateMechanic, deleteMechanic,
  listCustomers, createCustomer, updateCustomer, deleteCustomer,
  listInventory, createPart, updatePart, deletePart,
  listSuppliers, createSupplier, updateSupplier, deleteSupplier,
  listOrders, createOrder, updateOrder,
  listListings, updateListing, listReservations, updateReservation,
  getProfile, updateProfile, changePassword,
};
