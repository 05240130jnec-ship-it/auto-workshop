// Services customers can book (links like /booking?service=brake-repair)
export const BOOKABLE = [
  { slug: 'engine-diagnostics', title: 'Engine Diagnostics', service: 'Engine Diagnostics', price: 1000, image: '/media/engine/engine1.jpg',
    text: 'Computer scan and expert inspection for warning lights, rough idle and loss of power.' },
  { slug: 'brake-repair', title: 'Brake Pad Replacement', service: 'Brake Service', price: 9189, image: '/media/brake/brake2.jpg',
    text: 'Professional inspection and replacement of front or rear brake pads.' },
  { slug: 'oil-change', title: 'Oil Change', service: 'Oil Change', price: 700, image: '/media/oil/oil2.jpg',
    text: 'Fresh engine oil and a new filter to keep your engine running smoothly.' },
  { slug: 'car-wash', title: 'Car Wash', service: 'Car Wash & Detailing', price: 300, image: '/media/car wash/wash1.jpg',
    text: 'Exterior wash and interior clean so your car looks and feels new.' },
]

export const PICKUP_FEE = 500
export const TIME_SLOTS = ['08:00 AM', '09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '04:30 PM']
export const MAX_PER_SLOT = 2 // two bays — a slot is full after 2 bookings

// Picture for a repair card, based on the service
export function imageFor(service) {
  if (/brake/i.test(service)) return '/media/brake/brake2.jpg'
  if (/oil/i.test(service)) return '/media/oil/oil2.jpg'
  if (/wash/i.test(service)) return '/media/car wash/wash2.jpg'
  return '/media/engine/engine3.jpg'
}
