// Shown on the login page as one-click demo logins (accounts created by seed.js in the backend)
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