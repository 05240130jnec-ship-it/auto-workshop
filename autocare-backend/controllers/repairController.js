// controllers/repairController.js — a customer's own repairs (book, see, cancel).

const Repair = require('../models/repairModel');
const { bookingRules, checkVehicleType, checkToyota } = require('../models/settingsModel');
const { cleanPlate, cleanVehicle, PLATE_ERROR, VEHICLE_ERROR } = require('../utils/vehicle-rules');

// GET /api/repairs  -> my repairs
async function myRepairs(req, res) {
  res.json(await Repair.findByCustomer(req.user.id));
}

// GET /api/repairs/slots?date=2026-10-28  -> how full each time slot is
async function slots(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Please choose a date.' });

  const rows = await Repair.countBySlot(date);
  const { timeSlots, maxPerSlot } = await bookingRules();   // time slots + cars per slot come from MySQL
  res.json(timeSlots.map((time) => {
    const found = rows.find((r) => r.apptTime === time);
    const booked = found ? found.booked : 0;
    return { time, booked, full: booked >= maxPerSlot };
  }));
}

// GET /api/repairs/ACP-9247  -> one of my repairs, with parts and services
async function getOne(req, res) {
  const repair = await Repair.findOneOfCustomer(req.params.id, req.user.id);
  if (!repair) return res.status(404).json({ error: 'Repair not found.' });
  const parts = await Repair.findParts(repair.id);
  const services = await Repair.findServices(repair.id);
  res.json({ ...repair, parts, services });
}

// POST /api/repairs  -> book a new repair
async function book(req, res) {
  const { service, notes, cost, apptDate, apptTime } = req.body;

  if (!req.body.vehicle || !req.body.plate || !service || !apptDate || !apptTime) {
    return res.status(400).json({ error: 'Please fill in vehicle, plate, service, date and time.' });
  }
  // Check the car name and the Bhutan plate number (e.g. BP-1-A1234)
  const vehicle = cleanVehicle(req.body.vehicle);
  if (!vehicle) return res.status(400).json({ error: VEHICLE_ERROR });
  const plate = cleanPlate(req.body.plate);
  if (!plate) return res.status(400).json({ error: PLATE_ERROR });
  // The vehicle type must be one of the admin's list (Website Content -> Lists)
  const vehicleType = await checkVehicleType(req.body.vehicleType);
  if (!vehicleType) return res.status(400).json({ error: 'Please choose a vehicle type from the list.' });
  // We service Toyota only: the model must be in the admin's list for that type (Website Content -> Lists)
  if (!(await checkToyota(vehicleType, vehicle))) {
    return res.status(400).json({ error: 'Please choose a Toyota model from the list for this vehicle type.' });
  }
  const { timeSlots, maxPerSlot } = await bookingRules();
  if (!timeSlots.includes(apptTime)) {
    return res.status(400).json({ error: 'Please pick a valid time slot.' });
  }
  if (await Repair.countInSlot(apptDate, apptTime) >= maxPerSlot) {
    return res.status(409).json({ error: 'That time slot is full. Please pick another.' });
  }

  const id = await Repair.nextId();
  await Repair.createBooking({
    id, customerId: req.user.id, vehicleType, vehicle, plate, service, cost: cost || 0, notes: notes || '',
    apptDate, apptTime,
    delivery: 'dropoff',                       // no home pickup: customers bring the car themselves
  });
  res.status(201).json({ id });
}

// PATCH /api/repairs/ACP-9251  -> cancel (only while pending)
async function cancel(req, res) {
  if (req.body.status !== 'cancelled') {
    return res.status(400).json({ error: 'You can only cancel a repair.' });
  }
  const status = await Repair.findStatusOfCustomer(req.params.id, req.user.id);
  if (status === undefined) return res.status(404).json({ error: 'Repair not found.' });
  if (status !== 'pending') {
    return res.status(400).json({ error: 'Only pending repairs can be cancelled.' });
  }
  await Repair.cancel(req.params.id);
  res.json({ id: req.params.id, status: 'cancelled' });
}

module.exports = { myRepairs, slots, getOne, book, cancel };
