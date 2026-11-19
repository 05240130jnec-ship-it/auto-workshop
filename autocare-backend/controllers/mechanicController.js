// controllers/mechanicController.js — the mechanic portal: my jobs, parts and services used,
// reports and my profile. A mechanic only ever sees jobs assigned to them.

const bcrypt = require('bcrypt');
const Repair = require('../models/repairModel');
const Inventory = require('../models/inventoryModel');
const Mechanic = require('../models/mechanicModel');
const Leave = require('../models/leaveModel');
const { onlyFields } = require('../models/helpers');

const NOT_MINE = { error: 'Job not found or not assigned to you.' };

// ---------- MY JOBS ----------

// GET /api/mechanic/repairs   (?status=progress -> only in-progress ones)
async function myRepairs(req, res) {
  const rows = await Repair.findByMechanic(req.user.id, req.query.status);
  if (rows.length === 0) return res.json([]);

  // Attach each job's parts and services (2 queries for all jobs, not 2 per job)
  const ids = rows.map((r) => r.id);
  const parts = await Repair.findPartsOfMany(ids);
  const services = await Repair.findServicesOfMany(ids);
  res.json(rows.map((r) => ({
    ...r,
    parts: parts.filter((p) => p.repairId === r.id),
    services: services.filter((s) => s.repairId === r.id)
  })));
}

// GET /api/mechanic/repairs/ACP-9247  -> one job with parts, services and total
async function getRepair(req, res) {
  const repair = await Repair.findOneOfMechanic(req.params.id, req.user.id);
  if (!repair) return res.status(404).json(NOT_MINE);

  const parts = await Repair.findParts(repair.id);
  const services = await Repair.findServices(repair.id);
  res.json({ ...repair, parts, services, total: await Repair.totalCost(repair.id) });
}

// PATCH /api/mechanic/repairs/ACP-9247  -> start, pause or finish a job, or add a work note
// pending -> progress -> complete   (progress -> pending is allowed too, e.g. waiting for a part)
async function updateRepair(req, res) {
  const { status, notes, addNote } = req.body || {};
  const repair = await Repair.findOneOfMechanic(req.params.id, req.user.id);
  if (!repair) return res.status(404).json(NOT_MINE);

  if (status) {
    const allowedNext = { pending: ['progress'], progress: ['complete', 'pending'], complete: [], cancelled: [] };
    if (!allowedNext[repair.status].includes(status)) {
      return res.status(400).json({ error: `A ${repair.status} job cannot be changed to ${status}.` });
    }
    await Repair.setStatus(repair.id, status);

    // When the job is finished, the bill = parts + services
    if (status === 'complete') {
      const total = await Repair.totalCost(repair.id);
      if (total > 0) await Repair.setCost(repair.id, total);
    }
  }
  if (notes !== undefined) await Repair.setNotes(repair.id, notes);
  // Work notes are kept as lines of text: "[2026-10-28] Ugyen Dorji: Replaced the brake pads"
  if (addNote && addNote.trim()) {
    const line = `[${new Date().toISOString().slice(0, 10)}] ${req.user.name}: ${addNote.trim()}`;
    await Repair.addWorkNote(repair.id, line);
  }

  res.json(await Repair.findOneOfMechanic(repair.id, req.user.id));
}

// ---------- PARTS USED ----------

// GET /api/mechanic/parts  -> parts to choose from
async function parts(req, res) {
  res.json(await Inventory.findAllForMechanic());
}

// POST /api/mechanic/repairs/ACP-9247/parts  -> log a part used (stock goes down)
async function addPart(req, res) {
  const { partId, qty } = req.body || {};
  const amount = Number(qty);
  // Whole numbers from 1 to 100 only (a minus number would ADD stock and lower the bill)
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return res.status(400).json({ error: 'Quantity must be a whole number from 1 to 100.' });
  }

  const repair = await Repair.findOneOfMechanic(req.params.id, req.user.id);
  if (!repair) return res.status(404).json(NOT_MINE);
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'Start the job before adding parts.' });
  }

  const part = await Inventory.findById(partId);
  if (!part) return res.status(404).json({ error: 'Part not found.' });

  if (!(await Inventory.takeStock(partId, amount))) {
    return res.status(409).json({ error: `Only ${part.stock} ${part.name} left in stock.` });
  }

  const id = await Repair.addPart(repair.id, part, amount);
  res.status(201).json({ id, name: part.name, qty: amount, price: part.price });
}

// DELETE /api/mechanic/repairs/ACP-9247/parts/3  -> remove a wrong entry (stock goes back)
async function removePart(req, res) {
  const repair = await Repair.findOneOfMechanic(req.params.id, req.user.id);
  if (!repair) return res.status(404).json(NOT_MINE);
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'You can only change parts while the job is in progress.' });
  }

  const row = await Repair.findPartRow(req.params.rowId, repair.id);
  if (!row) return res.status(404).json({ error: 'Part entry not found.' });

  await Repair.removePartRow(row.id);
  if (row.partId) await Inventory.addStock(row.partId, row.qty);
  res.json({ deleted: row.id });
}

// ---------- SERVICES DONE ----------

// POST /api/mechanic/repairs/ACP-9247/services  -> record labour, e.g. "Wheel alignment"
async function addService(req, res) {
  const name = String((req.body || {}).name || '').trim();
  const qty = Number((req.body || {}).qty ?? 1);
  const cost = Number((req.body || {}).cost);
  if (!name || name.length > 100) return res.status(400).json({ error: 'Please choose the service you did.' });
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return res.status(400).json({ error: 'Quantity must be a whole number from 1 to 100.' });
  if (!Number.isFinite(cost) || cost < 0 || cost > 1000000) return res.status(400).json({ error: 'Cost must be a number from 0 to 1,000,000.' });

  const repair = await Repair.findOneOfMechanic(req.params.id, req.user.id);
  if (!repair) return res.status(404).json(NOT_MINE);
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'Start the job before adding services.' });
  }

  const id = await Repair.addService(repair.id, name, qty, cost);
  res.status(201).json({ id, name, qty, cost });
}

// DELETE /api/mechanic/repairs/ACP-9247/services/2  -> remove a wrong service line
async function removeService(req, res) {
  const repair = await Repair.findOneOfMechanic(req.params.id, req.user.id);
  if (!repair) return res.status(404).json(NOT_MINE);
  if (repair.status !== 'progress') {
    return res.status(400).json({ error: 'You can only change services while the job is in progress.' });
  }
  if (!(await Repair.removeServiceRow(req.params.rowId, repair.id))) {
    return res.status(404).json({ error: 'Service entry not found.' });
  }
  res.json({ deleted: Number(req.params.rowId) });
}

// ---------- REPORTS ----------

// GET /api/mechanic/reports  -> my work summary
async function reports(req, res) {
  const me = req.user.id;
  const jobs = await Repair.countByStatus(me);
  const month = await Repair.monthSummary(me);
  const partsUsed = await Repair.partsUsedBy(me);
  const recentCompleted = await Repair.recentCompleted(me);
  res.json({
    jobs,
    completedThisMonth: month.total,
    earnedThisMonth: Number(month.earned),
    partsUsed,
    recentCompleted
  });
}

// ---------- PROFILE ----------

// GET /api/mechanic/profile
async function getProfile(req, res) {
  await Leave.applyLeaves();                   // an approved leave may have started or ended today
  res.json(await Mechanic.findById(req.user.id));
}

// PATCH /api/mechanic/profile  -> mechanic can change phone, specialization, experience,
// photo and availability (name and email are controlled by the admin)
async function updateProfile(req, res) {
  const body = { ...(req.body || {}) };
  // The mechanic can say "Available" or "Busy". Leave is asked for with a leave request (the admin decides).
  if (body.status === 'leave') {
    return res.status(400).json({ error: 'To go on leave, please send a leave request. The admin will approve it.' });
  }
  if (body.status && !['active', 'busy'].includes(body.status)) {
    return res.status(400).json({ error: 'Status must be active or busy.' });
  }
  if (body.status) {
    const me = await Mechanic.findById(req.user.id);
    if (me && me.status === 'leave') return res.status(400).json({ error: 'You are on leave. The admin will set you back to work.' });
  }
  // Bhutan phone, e.g. 17123456 or +975 17123456
  if (body.phone !== undefined) {
    body.phone = String(body.phone).replace(/[\s-]/g, '');
    if (!/^(\+?975)?[1-8]\d{7}$/.test(body.phone)) return res.status(400).json({ error: 'Please enter a valid Bhutan phone number, e.g. 17123456.' });
  }
  if (body.experience !== undefined) {
    body.experience = Number(body.experience);
    if (!Number.isInteger(body.experience) || body.experience < 0 || body.experience > 60) {
      return res.status(400).json({ error: 'Years of experience must be a whole number from 0 to 60.' });
    }
  }
  if (body.specialization !== undefined && !String(body.specialization).trim()) {
    return res.status(400).json({ error: 'Please choose a specialization.' });
  }
  // Profile photo: a small picture (data:image/…) made by the website, or null to remove it
  if (body.photo !== undefined && body.photo !== null) {
    if (typeof body.photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(body.photo)) {
      return res.status(400).json({ error: 'Please choose a JPG, PNG or WEBP picture.' });
    }
    if (body.photo.length > 400 * 1024) return res.status(400).json({ error: 'This picture is too big.' });
  }
  const ok = await Mechanic.update(req.user.id, onlyFields(body, ['phone', 'specialization', 'experience', 'photo', 'status']));
  if (ok === null) return res.status(400).json({ error: 'Nothing to update.' });

  res.json(await Mechanic.findById(req.user.id));
}

// PATCH /api/mechanic/profile/password  -> change my password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Enter your current and new password.' });
  }
  // Same rule as customers: at least 8 characters, with a letter and a number
  if (String(newPassword).length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({ error: 'New password needs at least 8 characters, with a letter and a number.' });
  }

  const correct = await bcrypt.compare(currentPassword, await Mechanic.getPasswordHash(req.user.id));
  if (!correct) return res.status(401).json({ error: 'Current password is wrong.' });

  await Mechanic.setPassword(req.user.id, await bcrypt.hash(newPassword, 10));
  res.json({ message: 'Password changed.' });
}

// ---------- LEAVE ----------

// GET /api/mechanic/leaves  -> my leave requests (newest first)
async function myLeaves(req, res) {
  await Leave.applyLeaves();
  res.json(await Leave.findByMechanic(req.user.id));
}

// POST /api/mechanic/leaves  { fromDate, toDate, reason }  -> ask the admin for leave
async function requestLeave(req, res) {
  const { fromDate, toDate } = req.body || {};
  const reason = String((req.body || {}).reason || '').trim();
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE.test(fromDate || '') || !DATE.test(toDate || '')) {
    return res.status(400).json({ error: 'Please choose the first and the last day of your leave.' });
  }
  const todayLocal = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);   // Bhutan time
  if (fromDate < todayLocal) return res.status(400).json({ error: 'The leave cannot start in the past.' });
  if (toDate < fromDate) return res.status(400).json({ error: 'The last day must be on or after the first day.' });
  const days = (new Date(toDate) - new Date(fromDate)) / 86400000 + 1;
  if (days > 60) return res.status(400).json({ error: 'A leave can be 60 days at most.' });
  if (reason.length < 3) return res.status(400).json({ error: 'Please write a short reason.' });
  if (reason.length > 300) return res.status(400).json({ error: 'The reason is too long (300 letters at most).' });
  if (await Leave.overlaps(req.user.id, fromDate, toDate)) {
    return res.status(409).json({ error: 'You already asked for leave on some of these days.' });
  }
  const id = await Leave.nextId();
  await Leave.create({ id, mechanicId: req.user.id, fromDate, toDate, reason });
  res.status(201).json(await Leave.findById(id));
}

// DELETE /api/mechanic/leaves/LV-1001  -> take back a request the admin has not decided yet
async function cancelLeave(req, res) {
  const leave = await Leave.findById(req.params.id);
  if (!leave || leave.mechanicId !== req.user.id) return res.status(404).json({ error: 'Leave request not found.' });
  if (leave.status !== 'pending') return res.status(400).json({ error: 'The admin has already decided on this request.' });
  await Leave.setStatus(leave.id, 'cancelled');
  res.json({ id: leave.id, status: 'cancelled' });
}

module.exports = {
  myRepairs, getRepair, updateRepair, parts, addPart, removePart, addService, removeService,
  reports, getProfile, updateProfile, changePassword,
  myLeaves, requestLeave, cancelLeave,
};
