// vehicle-rules.js — checks the vehicle name and the Bhutan plate number.
// The website does the same check (autocare-react/src/data/vehicle.js), and the backend
// checks again here so nobody can skip it.
//
// A Bhutan plate looks like:  BP-1-A1234
//   BP    = prefix, the type of vehicle (BP, BT, BG, RBP or RBG)
//   1     = the region: 1 Thimphu, 2 Phuentsholing, 3 Gelephu, 4 Samdrup Jongkhar
//   A1234 = the number: an optional letter + 3 or 4 digits
// OK: BP-1-A1234  BT-2-1234  BG-3-5678  RBP-4-A234     NOT OK: BP-5-1234 (no region 5)

const PLATE = /^(RBP|RBG|BP|BT|BG)-?([1-4])-?([A-Z]?\d{3,4})$/;
const VEHICLE = /^(?=.*[A-Za-z])[A-Za-z0-9 .\-]{3,50}$/;

// Returns the tidy plate ("BP-1-A1234"), or null if it is not a Bhutan plate
function cleanPlate(text) {
  const t = String(text || '').toUpperCase().replace(/[\s-]/g, '');   // ignore spaces and hyphens
  const m = t.match(PLATE);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
}

// Returns the tidy vehicle name, or null if it is not valid
function cleanVehicle(text) {
  const v = String(text || '').trim().replace(/\s+/g, ' ');
  return VEHICLE.test(v) ? v : null;
}

const PLATE_ERROR = 'Please enter a valid Bhutan plate number. It must look like BP-1-A1234 (BP, BT, BG, RBP or RBG, then the region 1–4, then the number).';
const VEHICLE_ERROR = 'Please enter the car make and model, e.g. Toyota Corolla 2018 (letters, numbers, spaces only).';

module.exports = { cleanPlate, cleanVehicle, PLATE_ERROR, VEHICLE_ERROR };
