// Checks the vehicle name and the Bhutan plate number on the website.
// (The backend checks the same again in autocare-backend/vehicle-rules.js.)
//
// A Bhutan plate looks like:  BP-1-A1234
//   BP    = prefix, the type of vehicle (BP, BT, BG, RBP or RBG)
//   1     = the region: 1 Thimphu, 2 Phuentsholing, 3 Gelephu, 4 Samdrup Jongkhar
//   A1234 = the number: an optional letter + 3 or 4 digits
// OK: BP-1-A1234  BT-2-1234  BG-3-5678  RBP-4-A234     NOT OK: BP-5-1234 (no region 5)

// prefix -> vehicle type and plate colours (text colour, background)
export const PLATE_TYPES = {
  BP:  { name: 'Private vehicle', color: '#fff', bg: '#c62828' },
  BT:  { name: 'Taxi / public transport', color: '#000', bg: '#fbc02d' },
  BG:  { name: 'Government vehicle', color: '#fbc02d', bg: '#c62828' },
  RBP: { name: 'Royal Bhutan Police', color: '#fff', bg: '#1565c0' },
  RBG: { name: 'Royal Bodyguard', color: '#fff', bg: 'linear-gradient(90deg, #000 0 34%, #f57c00 34% 67%, #fbc02d 67%)' },
}

// region digit -> place
export const REGIONS = { 1: 'Thimphu', 2: 'Phuentsholing', 3: 'Gelephu', 4: 'Samdrup Jongkhar' }

const PLATE = /^(RBP|RBG|BP|BT|BG)-?([1-4])-?([A-Z]?\d{3,4})$/
const VEHICLE = /^(?=.*[A-Za-z])[A-Za-z0-9 .-]{3,50}$/

// The tidy plate ("BP-1-A1234"), or null if it is not a Bhutan plate
export function cleanPlate(text) {
  const t = String(text || '').toUpperCase().replace(/[\s-]/g, '')   // ignore spaces and hyphens
  const m = t.match(PLATE)
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null
}

// The vehicle type of a plate ({ name, color, bg }), or null
export function plateType(text) {
  const p = cleanPlate(text)
  return p ? PLATE_TYPES[p.split('-')[0]] : null
}

// The tidy vehicle name, or null if it is not valid
export function cleanVehicle(text) {
  const v = String(text || '').trim().replace(/\s+/g, ' ')
  return VEHICLE.test(v) ? v : null
}

export const PLATE_ERROR = 'Please enter a valid Bhutan plate number. It must look like BP-1-A1234 (BP, BT, BG, RBP or RBG, then the region 1–4, then the number).'
export const VEHICLE_ERROR = 'Please enter the car make and model, e.g. Toyota Corolla 2018 (letters, numbers, spaces only).'

// While typing: true if what is typed so far can still become a Bhutan plate
//   "B", "BP", "BP-1", "BP-1-A12" -> true      "XY", "BPA", "BP-5" -> false
export function plateStartOk(text) {
  const t = String(text || '').toUpperCase().replace(/[\s-]/g, '')
  const prefix = ['RBP', 'RBG', 'BP', 'BT', 'BG'].find((p) => t.startsWith(p))
  if (!prefix) return ['BP', 'BT', 'BG', 'RBP', 'RBG'].some((p) => p.startsWith(t))   // still typing the prefix
  const rest = t.slice(prefix.length)                                                // e.g. "1A1234"
  return /^([1-4]([A-Z]?\d{0,4})?)?$/.test(rest)   // region 1–4, then an optional letter, then up to 4 digits
}

// While typing: capital letters and hyphens are put in by themselves
//   "bp" -> "BP"    "bp1" -> "BP-1"    "bp1a1234" -> "BP-1-A1234"
// After the prefix comes ONE digit, then a hyphen. Backspace still works normally.
export function formatPlate(text) {
  const t = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const m = t.match(/^(RBP|RBG|BP|BT|BG)(\d?)(.*)$/)
  if (!m) return t                       // not a Bhutan prefix: leave it, the box turns red
  let out = m[1]                         // prefix, e.g. BP
  if (m[2]) out += '-' + m[2]            // one digit, e.g. 1
  if (m[3]) out += '-' + m[3]            // the number, e.g. A1234
  return out
}