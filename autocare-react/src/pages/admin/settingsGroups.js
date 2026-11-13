// The settings the admin can edit on Website Content, grouped by tab.
// Each field = one row in the MySQL table `settings` (name = the setting, value = the text).
// "line" lists are one item per line; parts of one line are separated by |

const LINES = 'One per line'
const IMG = 'A picture in autocare-react/public/media, e.g. /media/engine/engine1.jpg'
const STARS = 'Put *stars* around the words that should be orange'

export const SETTINGS_GROUPS = [
  {
    key: 'home', label: 'Home page',
    fields: [
      { name: 'homeTag', label: 'Small label above the title' },
      { name: 'homeTitle', label: 'Welcome title', help: STARS },
      { name: 'homeText', label: 'Welcome text', type: 'textarea', col: 12 },
      { name: 'homeImage', label: 'Welcome picture', help: IMG },
      { name: 'homeChip', label: 'Picture badge', help: 'Title|small text, e.g. Certified technicians|Genuine parts' },
      { name: 'homePoints', label: 'Welcome points', type: 'textarea', help: LINES },
      { name: 'introTitle', label: 'Intro title' },
      { name: 'introImage', label: 'Intro picture', help: IMG },
      { name: 'introText', label: 'Intro text', type: 'textarea', col: 12, help: 'One paragraph per line' },
      { name: 'introTicks', label: 'Intro ✓ points', type: 'textarea', col: 12, help: LINES },
    ],
  },
  {
    key: 'about', label: 'About page',
    fields: [
      { name: 'aboutTitle', label: 'Title', help: STARS },
      { name: 'aboutImage', label: 'Top picture', help: IMG },
      { name: 'aboutText', label: 'Text under the title', type: 'textarea', col: 12 },
      { name: 'storyTitle', label: 'Our Story: title' },
      { name: 'storyImage', label: 'Our Story: picture', help: IMG },
      { name: 'storyText', label: 'Our Story: text', type: 'textarea', col: 12, help: 'One paragraph per line' },
      { name: 'pillars', label: 'Core Pillars cards', type: 'textarea', col: 12, help: 'icon|title|text|link|link text — e.g. bi-cpu-fill|Smart Management|Text…|/my-repairs|Track my repairs' },
      { name: 'whyUs', label: 'What Makes Us Different cards', type: 'textarea', col: 12, help: 'icon|title|text — icons from icons.getbootstrap.com, use the -fill ones' },
      { name: 'values', label: 'What We Stand For cards', type: 'textarea', col: 12, help: 'icon|title|text' },
      { name: 'team', label: 'Team members', type: 'textarea', col: 12, help: 'name|role — one person per line' },
      { name: 'ctaTitle', label: 'Bottom box: title' },
      { name: 'ctaText', label: 'Bottom box: text' },
    ],
  },
  {
    key: 'contact', label: 'Contact & footer',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, help: 'The Email Us buttons open Gmail to this address' },
      { name: 'phone', label: 'Phone (shown on the site)', required: true, placeholder: '+975 17XXXXXX' },
      { name: 'whatsapp', label: 'WhatsApp number', required: true, placeholder: '97517XXXXXX', help: 'Country code + number, no + or spaces' },
      { name: 'address', label: 'Address', required: true },
      { name: 'addressNote', label: 'Address note', col: 12 },
      { name: 'hours', label: 'Opening hours', type: 'textarea', col: 12, help: 'day|time — e.g. Sunday|Closed' },
      { name: 'hoursNote', label: 'Note under the hours', col: 12 },
      { name: 'contactIntro', label: 'Contact page intro', type: 'textarea', col: 12 },
      { name: 'footerText', label: 'Footer text', col: 12 },
    ],
  },
  {
    key: 'booking', label: 'Booking rules',
    fields: [
      { name: 'timeSlots', label: 'Time slots', type: 'textarea', required: true, col: 12, help: 'One time per line, e.g. 08:00 AM — customers can only book these times' },
      { name: 'maxPerSlot', label: 'Cars per time slot', type: 'number', min: 1, required: true, help: 'A slot is full after this many bookings' },
    ],
  },
  {
    key: 'shop', label: 'Shop pages',
    fields: [
      { name: 'shopCategories', label: 'Shop pages', type: 'textarea', required: true, col: 12,
        help: 'slug|name|description — the first one is /shop, the others /shop/<slug>. Parts show on a page when their Inventory category = the name.' },
    ],
  },
  {
    key: 'lists', label: 'Lists',
    fields: [
      { name: 'vehicleTypes', label: 'Vehicle types', type: 'textarea', required: true, col: 12,
        help: 'One per line — customers pick one when booking, e.g. SUV' },
      { name: 'carModels', label: 'Toyota models', type: 'textarea', required: true, col: 12,
        help: 'type|model — one per line, e.g. SUV|Land Cruiser Prado. The type must be one of the vehicle types above.' },
      { name: 'specializations', label: 'Mechanic specialisations', type: 'textarea', required: true, col: 12, help: LINES },
    ],
  },
]
