// The admin account is fixed. Mechanics and customers log in with the
// email + password stored in the shared data (src/data/seed.js), so a
// customer who signs up can log in straight away.
export const ADMIN = { id: 'admin', role: 'admin', name: 'Admin User', email: 'admin@autocare.bt', password: 'admin123' }

// Shown on the login page as one-click demo logins
export const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Admin', email: 'admin@autocare.bt', password: 'admin123' },
  { role: 'mechanic', label: 'Mechanic', email: 'ugyen@autocare.bt', password: 'mech123' },
  { role: 'customer', label: 'Customer', email: 'karma@gmail.com', password: 'user123' },
]

// Where each role lands after logging in
export const HOME_FOR = {
  admin: '/admin',
  mechanic: '/mechanic',
  customer: '/my-repairs',
}
