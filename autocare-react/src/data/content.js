// Helpers for the website content that comes from MySQL (offers, services, shop products).
// The data itself is loaded with useApi('/content/...') — see backend routes/content.js.

// The offer for a service, if one is running, e.g. offerFor(offers, 'brake-repair')
export function offerFor(offers, slug) {
  return (offers || []).find((o) => o.serviceSlug === slug && o.percent > 0) || null
}

// Price after the offer, e.g. salePrice(9189, { percent: 20 }) -> 7351
export function salePrice(price, offer) {
  if (!offer) return price
  return Math.round(price * (100 - offer.percent) / 100)
}

// "20% off brake pads\nFree inspection" -> ['20% off brake pads', 'Free inspection']
export function lines(text) {
  return String(text || '').split('\n').map((s) => s.trim()).filter(Boolean)
}

// Address of a service's details page: its own page, or /services/<slug>
export function detailLink(service) {
  return service.page || '/services/' + service.slug
}

// "Saturday|8:00 AM – 6:00 PM\nSunday|Closed" -> [['Saturday', '8:00 AM – 6:00 PM'], ['Sunday', 'Closed']]
export function rows(text) {
  return lines(text).map((line) => line.split('|').map((s) => s.trim()))
}

// The shop pages from the settings: [{ slug: 'auto-parts', name: 'Auto Parts', text: '...' }, ...]
export function shopCategories(settings) {
  return rows(settings && settings.shopCategories).map(([slug, name, text]) => ({ slug, name: name || slug, text: text || '' }))
}

// Address of a shop page: the first category is /shop, the others /shop/<slug>
export function shopLink(cats, cat) {
  return cats[0] && cats[0].slug === cat.slug ? '/shop' : '/shop/' + cat.slug
}

// Links for the Email and WhatsApp buttons (email + number come from the settings)
export function gmailLink(email) {
  return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email || '') + '&su=' + encodeURIComponent('Enquiry from AutoCarePro website')
}
export function whatsappLink(number) {
  return 'https://wa.me/' + String(number || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('Hello AutoCarePro, I would like to ask about a service.')
}

