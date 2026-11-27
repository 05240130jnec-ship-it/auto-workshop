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
      { name: 'homeTag', label: 'Small label above the title', help: 'Write {address} and the address from Contact & footer is shown there' },
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
    key: 'login', label: 'Login & profile',
    fields: [
      { name: 'loginButton', label: 'Navbar: log in button text', placeholder: 'Log in' },
      { name: 'loginFormTitle', label: 'Login page: title', placeholder: 'Welcome back' },
      { name: 'loginFormText', label: 'Login page: text under the title' },
      { name: 'signupTitle', label: 'Create account pop-up: title' },
      { name: 'signupText', label: 'Create account pop-up: text under the title' },
      { name: 'signupDoneTitle', label: 'After sign-up: title' },
      { name: 'signupDoneText', label: 'After sign-up: message', type: 'textarea', col: 12, help: '{name} is replaced by the customer’s first name' },
      { name: 'verifyEmailSubject', label: '"Is it you?" email: subject', col: 12 },
      { name: 'verifyEmailText', label: '"Is it you?" email: message (the Yes / No buttons are added below it)', type: 'textarea', col: 12, help: '{name} = first name, {email} = the email address' },
      { name: 'verifySentTitle', label: 'After sign-up (check your email): title' },
      { name: 'verifySentText', label: 'After sign-up (check your email): message', type: 'textarea', col: 12, help: '{email} is replaced by the email address' },
      { name: 'verifyYesTitle', label: 'After clicking Yes: title' },
      { name: 'verifyYesText', label: 'After clicking Yes: message', type: 'textarea', col: 12, help: '{name} is replaced by the first name' },
      { name: 'verifyNoTitle', label: 'After clicking No: title' },
      { name: 'verifyNoText', label: 'After clicking No: message', type: 'textarea', col: 12 },
      { name: 'forgotTitle', label: 'Forgot password: title' },
      { name: 'forgotText', label: 'Forgot password: text under the title' },
      { name: 'forgotCodeText', label: 'Forgot password: text after the code is sent', col: 12, help: '{email} is replaced by the email address' },
      { name: 'forgotDoneTitle', label: 'Password changed: title' },
      { name: 'forgotDoneText', label: 'Password changed: message' },
      { name: 'resetEmailSubject', label: 'Reset email: subject', col: 12 },
      { name: 'resetEmailText', label: 'Reset email: message', type: 'textarea', col: 12, help: '{name} = first name, {code} = the 6-digit code, {minutes} = how long it works' },
      { name: 'profileTitle', label: 'My profile page: title', help: STARS },
      { name: 'profileText', label: 'My profile page: text under the title', type: 'textarea', col: 12 },
    ],
  },
  {
    key: 'contact', label: 'Contact & footer',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true, help: 'The Email Us buttons open Gmail to this address' },
      { name: 'phone', label: 'Phone (shown on the site)', required: true, placeholder: '+975 17XXXXXX', help: 'Changes by itself when you change your phone in My Profile.' },
      { name: 'whatsapp', label: 'WhatsApp number', required: true, placeholder: '97517XXXXXX', help: 'Country code + number, no + or spaces. Payments are also sent here.' },
      { name: 'payText', label: 'How to pay (shown above the Pay via WhatsApp button)', type: 'textarea', col: 12, help: 'e.g. your mBoB / mPay account number' },
      { name: 'payMessage', label: 'WhatsApp payment message', type: 'textarea', col: 12, help: '{amount} = the amount, {what} = the booking or order' },
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
    key: 'popups', label: 'Pop-up messages',
    fields: [
      { name: 'askBookTitle', label: 'Before booking a repair — question', required: true },
      { name: 'askBook', label: 'Before booking a repair — details', type: 'textarea', required: true, col: 12, help: 'You can write {service}, {vehicle}, {date}, {time} and {total}' },
      { name: 'askOrderTitle', label: 'Before ordering a part — question', required: true },
      { name: 'askOrder', label: 'Before ordering a part — details', type: 'textarea', required: true, col: 12, help: 'You can write {item}, {qty}, {total} and {pickup}' },
      { name: 'askSellTitle', label: 'Before selling a part — question', required: true },
      { name: 'askSell', label: 'Before selling a part — details', type: 'textarea', required: true, col: 12, help: 'You can write {name}, {qty} and {price}' },
      { name: 'msgCancelledTitle', label: 'After cancelling — title', required: true },
      { name: 'msgCancelled', label: 'After cancelling — message', type: 'textarea', required: true, col: 12, help: 'You can write {what} (Booking or Order) and {id}' },
      { name: 'msgBookedTitle', label: 'After booking a repair — title', required: true },
      { name: 'msgBooked', label: 'After booking a repair — message', type: 'textarea', required: true, col: 12, help: 'You can write {id}, {service}, {vehicle}, {date} and {time}' },
      { name: 'msgOrderedTitle', label: 'After ordering a part — title', required: true },
      { name: 'msgOrdered', label: 'After ordering a part — message', type: 'textarea', required: true, col: 12, help: 'You can write {id}, {item}, {qty} and {pickup}' },
      { name: 'msgSoldTitle', label: 'After selling a part — title', required: true },
      { name: 'msgSold', label: 'After selling a part — message', type: 'textarea', required: true, col: 12, help: 'You can write {name} (the part name)' },
      { name: 'msgCancelBooking', label: 'Before cancelling a booking', type: 'textarea', required: true, col: 12, help: 'You can write {id} and {vehicle}' },
      { name: 'msgCancelOrder', label: 'Before cancelling a part order', type: 'textarea', required: true, col: 12, help: 'You can write {id}, {item} and {qty}' },
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
