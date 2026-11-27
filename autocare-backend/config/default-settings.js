// config/default-settings.js — the STARTING website text and booking rules.
// The admin edits them in Website Content. These values are put into the MySQL table
// `settings` once (models/settingsModel.js -> setupSettings); after that MySQL is the only source.
//
// Lists are written one item per line. Some lines have parts separated by "|",
// e.g. hours:  "Saturday|8:00 AM – 6:00 PM".  In titles, *stars* mark the orange words.

const DEFAULT_SETTINGS = {
  // ---------- Booking rules ----------
  timeSlots: '08:00 AM\n09:00 AM\n11:00 AM\n01:00 PM\n03:00 PM\n04:30 PM',
  maxPerSlot: '2',
  pickupFee: '500',

  // ---------- Contact details + footer ----------
  email: 'chungkuwangmo6@gmail.com',
  phone: '+975 17319436',
  whatsapp: '97517319436',
  address: 'Sarpang, Bhutan',
  addressNote: 'Located in the heart of the city. Drop by during business hours.',
  hours: 'Monday – Friday|8:00 AM – 6:00 PM\nSaturday|8:00 AM – 6:00 PM\nSunday|Closed',
  hoursNote: 'We aim to respond within 24 hours on business days. For urgent matters, reach us on WhatsApp.',
  contactTag: 'Contact',
  contactTitle: 'Get in *touch* with us',
  contactImage: '/media/contact.webp',
  hoursTitle: 'Business hours',
  emailCardTitle: 'Email us',
  emailCardText: "Send us an email and we'll get back to you within 24 hours.",
  emailCardLink: 'Write an email',
  whatsappCardTitle: 'WhatsApp',
  whatsappCardText: 'Prefer instant messaging? Chat with us on WhatsApp.',
  whatsappCardLink: 'Start a chat',
  visitCardTitle: 'Visit our workshop',
  visitCardLink: 'Get directions',
  contactIntro: 'We are here to help with any questions about our services, repairs, or parts. Reach out and we will respond promptly.',
  footerText: '© 2026 AutoCarePro. All rights reserved.',

  // ---------- Payment (through WhatsApp) ----------
  payText: 'Pay with mBoB or mPay to the workshop account, then send the payment screenshot to us on WhatsApp. We will mark it as paid.',
  payMessage: 'Hello AutoCare Pro, I want to pay {amount} for {what}. I will send the payment screenshot here.',

  // ---------- Pop-up messages for customers ----------
  // {id} {service} {vehicle} {date} {time} {item} {qty} {pickup} {name} are filled in by the website
  askBookTitle: 'Confirm your booking?',
  askBook: '{service} for your {vehicle} on {date} at {time}. Estimated total: {total}.',
  askOrderTitle: 'Confirm your order?',
  askOrder: '{qty} × {item} for {total}. You will collect it on {pickup}.',
  askSellTitle: 'Send this part to the workshop?',
  askSell: '{qty} × {name} for {price} each. Our team will check it and answer you.',
  msgCancelledTitle: 'Cancelled',
  msgCancelled: '{what} #{id} has been cancelled.',
  msgBookedTitle: 'Booking confirmed!',
  msgBooked: 'Your booking #{id} for {service} is saved. Please bring your {vehicle} on {date} at {time}.',
  msgOrderedTitle: 'Order placed!',
  msgOrdered: 'Your order #{id} ({qty} × {item}) is reserved for you. Please collect it on {pickup}. You can pay via WhatsApp in My Repairs.',
  msgSoldTitle: 'Part sent to the workshop!',
  msgSold: 'Thank you! We received your {name}. Our team will check it and you will see the answer in My Repairs.',
  msgCancelBooking: 'Do you really want to cancel booking #{id} for your {vehicle}?',
  msgCancelOrder: 'Do you really want to cancel order #{id} ({qty} × {item})? The part goes back to the shop.',

  // ---------- Home page ----------
  homeTag: 'Auto workshop · {address}',            // {address} = the address from Contact & footer
  homeTitle: 'Your Trusted *Auto Care* Partner',
  homeText: 'Expert service, genuine parts, and a commitment to get you back on the road safely.',
  homeImage: '/media/engine/engine1.jpg',
  homePoints: 'Certified technicians\nGenuine parts\nFree inspection',
  homeChip: 'Certified technicians|Genuine parts · Fair pricing',
  introTitle: 'Expert Care for Every Car',
  introText: 'From routine maintenance to complex engine overhauls, our certified technicians combine decades of hands-on experience with cutting-edge diagnostic technology.\n' +
    "We don't just fix cars – we build relationships. Our integrated inventory and supplier management ensures genuine parts, faster turnaround, and fair pricing.",
  introTicks: 'Certified technicians\nGenuine spare parts\nFast turnaround\nFair pricing',
  introImage: '/media/engine/engine2.jpg',

  // ---------- Login page + "Create an account" pop-up ----------
  loginButton: 'Log in',                      // the button in the navbar for visitors
  loginFormTitle: 'Welcome back',
  loginFormText: 'Sign in and we’ll take you to the right place.',
  signupTitle: 'Create your account',
  signupText: "It's free and only takes a minute",
  signupDoneTitle: 'Account created successfully!',
  signupDoneText: 'Welcome to AutoCare Pro, {name}. Your account is ready and you are signed in.',

  // ---------- Forgot password page + the email with the code ----------
  forgotTitle: 'Forgot your password?',
  forgotText: 'Enter the email of your account and we will send you a 6-digit code.',
  forgotCodeText: 'We sent a 6-digit code to {email}. Type it below with your new password.',
  forgotDoneTitle: 'Password changed!',
  forgotDoneText: 'Your new password is saved. You can sign in with it now.',
  resetEmailSubject: 'Your AutoCare Pro password reset code',
  resetEmailText: 'Hello {name},\n\nYour password reset code is: {code}\n\nIt works for {minutes} minutes. If you did not ask for this, you can ignore this email.\n\nAutoCare Pro',

  // ---------- "Is it you?" email after sign-up ----------
  verifyEmailSubject: 'Is it you? Confirm your AutoCare Pro account',
  verifyEmailText: 'Hello {name},\n\nSomeone used {email} to create an account on AutoCare Pro. Was it you?\n\nIf yes, click "Yes, it\'s me" to finish your account. If not, click "No, it\'s not me" and nobody can use your email.',
  verifySentTitle: 'Check your email',
  verifySentText: 'We sent an email to {email}. Open it and click "Yes, it\'s me" to finish your account. (Look in Spam too.)',
  verifyYesTitle: 'Your email is confirmed!',
  verifyYesText: 'Welcome to AutoCare Pro, {name}. Your account is ready and you are now logged in.',
  verifyNoTitle: 'Thank you for telling us',
  verifyNoText: 'The account was not made, and nobody can use your email.',

  // ---------- My profile page (customers) ----------
  profileTitle: 'My *profile*',
  profileText: 'Keep your details up to date so the workshop can reach you about your repairs.',

  // ---------- Mechanic portal (admin → Mechanic Portal, NOT the customer website) ----------
  mPortalLabel: 'Mechanic portal',
  mDashTitle: 'Dashboard',
  mDashText: "Welcome back, {name} 👋 Here's your workload today.",
  mRepairsTitle: 'My Repairs',
  mRepairsText: 'All repair orders assigned to you',
  mPartsTitle: 'Parts Used',
  mPartsText: 'Every spare part you logged on your jobs',
  mReportsTitle: 'My Reports',
  mReportsText: 'Summary of your repair activities',
  mProfileTitle: 'My Profile',
  mProfileText: 'Manage your mechanic profile and availability',
  mMenuProfile: 'My profile',
  mMenuLogout: 'Log out',
  mNoteNew: 'New job assigned to you',
  mNoteToday: 'Car arrives today at {time}',
  mNoteLate: 'Job is overdue',
  mNoteEmpty: "No notifications. You're all caught up.",
  mNoteLeaveOk: 'Your leave is approved',
  mNoteLeaveNo: 'Your leave request was not approved',
  mLeaveTitle: 'My Leave',
  mLeaveText: 'Ask the admin for leave and see the answer here',
  mTodayWaiting: '{count} job(s) waiting to start',
  mTodayDone: 'No jobs waiting. Great work!',
  mTodayStart: 'Start next job',
  mTodayContinue: 'Continue job',
  mJobVehicle: 'Vehicle & Customer',
  mJobProblem: 'Problem Description',
  mJobNoProblem: 'No description given.',
  mJobNotes: 'Work Notes',
  mJobStatus: 'Update Status',
  mJobAddNote: 'Add Note',
  mJobSaveNote: 'Save note',
  mJobParts: 'Log Parts Used',
  mJobAddPart: 'Add Part',
  mJobNoParts: 'No parts logged yet.',
  mJobServices: 'Log Services',
  mJobAddService: 'Add Service',
  mJobGrand: 'Grand Total',
  mJobComplete: 'Complete Repair',
  mJobReady: '{vehicle} is ready for pickup 🎉',
  mProfInfo: 'Personal Information',
  mProfPro: 'Professional Details',
  mProfPassword: 'Change Password',
  mProfNameNote: 'To change your name or login email, ask the admin.',
  mDashJobs: 'My repair orders',
  mDashParts: 'Parts used recently',
  // Staff login page (/staff-login): mechanics and the admin, no sign-up
  staffLoginTitle: 'Staff login',
  staffLoginText: 'For AutoCare Pro mechanics and the workshop admin.',
  staffLoginNote: 'No account? Ask the workshop admin to add you.',

  // ---------- About page ----------
  // Login page + "Create an account" pop-up
  loginTag: 'Trusted Toyota service',
  loginTitle: 'Your car, *in good hands.*',
  loginText: 'Sign in to book a service, follow your repair step by step and order genuine parts.',
  loginPoints: 'bi-calendar-check|Book a service in a few clicks\nbi-activity|See your repair status live\nbi-bag-check|Order parts and collect them at the workshop',
  loginFormTitle: 'Welcome back',
  loginFormText: 'Sign in and we’ll take you to the right place.',
  signupTitle: 'Create your account',
  signupText: "It's free and only takes a minute",
  signupDoneTitle: 'Account created successfully!',
  signupDoneText: 'Welcome to AutoCare Pro, {name}. Your account is ready and you are signed in.',
  // My profile page (customers)
  profileTitle: 'My *profile*',
  profileText: 'Keep your details up to date so the workshop can reach you about your repairs.',
  aboutTitle: 'About *AutoCarePro*',
  aboutText: 'Your trusted web-based auto workshop, where expert repairs meet genuine spare parts, all managed on one smart digital platform.',
  aboutImage: '/media/car%20wash/wash2.jpg',
  storyTitle: 'Built for Modern Workshops',
  storyText: 'AutoCarePro is a smart web-based auto workshop management system created to replace slow and outdated paper-based processes. Our goal is to make workshop operations faster, easier, and more organized for both customers and mechanics.\n' +
    'We believe every customer should stay informed about their vehicle’s repair progress in real time, while mechanics should have a clear and efficient digital workspace to manage their daily tasks.\n' +
    'From booking repair services to purchasing genuine spare parts online, AutoCarePro combines everything a modern workshop needs into one simple and accessible platform.',
  storyImage: '/media/engine/engine3.jpg',
  // icon|title|text|link|link text
  pillars: 'bi-wrench-adjustable|Expert Repair Services|Book vehicle repair services online and track your vehicle status in real time, from pending to completed.|/services|View services\n' +
    'bi-box-seam-fill|Genuine Spare Parts Shop|Browse and purchase genuine spare parts directly from our workshop inventory through a simple online platform.|/shop|Shop parts\n' +
    'bi-cpu-fill|Smart Management|Admins and mechanics manage workshop operations digitally: job assignments, repair updates and inventory tracking.|/my-repairs|Track my repairs',
  // icon|title|text
  whyUs: 'bi-clock-fill|Real-time Status|Track your repair from anywhere, anytime.\n' +
    'bi-shield-fill-check|Genuine Parts|All parts sourced from trusted suppliers.\n' +
    'bi-people-fill|Skilled Mechanics|An experienced, specialized workshop team.\n' +
    'bi-globe-central-south-asia-fill|100% Online|Book, track and buy from any device.',
  values: "bi-patch-check-fill|Integrity|We never recommend a repair you don't need. Our diagnostics are thorough and our quotes honest.\n" +
    'bi-wrench-adjustable|Expertise|Continuous training and top-tier tools for every job.\n' +
    "bi-house-heart-fill|Community|We're your neighbors. Supporting local families and businesses is at the heart of what we do.\n" +
    'bi-check-circle-fill|Reliability|On-time service you can count on, every time.',
  // name|role
  team: 'Mrs. Kuenzang Lhamo|Diploma: CSN\nMr. Ugyen Dorji|Diploma: CSN\nMrs. Chungku Wangmo|Diploma: CSN',
  ctaTitle: 'Ready to get started?',
  ctaText: "Whether it's a routine service or a major repair, we're here to help. Reach out to us today for a free estimate.",

  // ---------- Shop pages (slug|name|description) — the name is also the Inventory category ----------
  shopCategories: 'auto-parts|Auto Parts|Engine oil, brake pads, batteries, tyres and more, all genuine parts.\n' +
    'accessories|Car Accessories|Upgrade comfort and style with seat covers, cameras, lights and more.\n' +
    'cleaning|Cleaning Products|Everything you need to keep your car clean inside and out.\n' +
    'safety|Emergency & Safety|Be ready for the road with jumper cables, first aid and safety gear.',

  // ---------- Lists used in forms ----------
  // vehicle types the customer can pick when booking (one per line)
  vehicleTypes: 'Car\nSUV\nPickup\nVan / Bus',
  // The workshop services Toyota only: type|model, one per line
  carModels: 'Car|Corolla\nCar|Yaris\nSUV|RAV4\nSUV|Fortuner\nSUV|Land Cruiser Prado\nPickup|Hilux\nVan / Bus|HiAce\nVan / Bus|Coaster',
  specializations: 'Engine & Diagnostics\nBrake Systems\nGeneral Repairs\nElectrical Systems\nBody & Paint\nAC & Cooling\nTyres & Alignment',
};

module.exports = { DEFAULT_SETTINGS };
