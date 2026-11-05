// Services, prices, time slots, cars per slot and the pickup fee all come from MySQL now
// (GET /api/content/services and /api/content/settings).

// Picture for a repair card, based on the service
export function imageFor(service) {
  if (/brake/i.test(service)) return '/media/brake/brake2.jpg'
  if (/oil/i.test(service)) return '/media/oil/oil2.jpg'
  if (/wash/i.test(service)) return '/media/car wash/wash2.jpg'
  return '/media/engine/engine3.jpg'
}
