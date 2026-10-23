// AutoCare Pro — backend API (Express + MySQL)
//   npm run dev        → start the server (restarts when you save)
//   npm run setup-db   → create / reset the database tables
require('dotenv').config({ quiet: true })
const express = require('express')
const cors = require('cors')
const db = require('./db')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: 'http://localhost:5173' })) // allow the React app to call this API
app.use(express.json())                             // read JSON bodies into req.body

// Health check: is the server AND the database OK?   GET /api/hello
app.get('/api/hello', async (req, res) => {
  const [rows] = await db.query('SELECT COUNT(*) AS repairs FROM repairs')
  res.json({ message: 'Hello from AutoCare backend!', database: 'connected', repairs: rows[0].repairs })
})

// Each group of routes lives in its own file in /routes
app.use('/api/auth', require('./routes/auth'))             // login, signup, me, change password
app.use('/api/repairs', require('./routes/repairs'))       // repair jobs + parts/services/notes
app.use('/api/customers', require('./routes/customers'))   // customers
app.use('/api/mechanics', require('./routes/mechanics'))   // mechanics
app.use('/api/inventory', require('./routes/inventory'))   // spare parts
app.use('/api/suppliers', require('./routes/suppliers'))   // suppliers
app.use('/api/orders', require('./routes/orders'))         // purchase orders
app.use('/api/shop', require('./routes/shop'))             // shop orders + sell-a-part listings
app.use('/api/dashboard', require('./routes/dashboard'))   // admin dashboard numbers

// Unknown address → 404 in JSON
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` })
})

// Any crash inside a route ends up here → 500 in JSON (details printed in the terminal)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The JSON you sent is not valid' })
  const hint = err.code === 'ECONNREFUSED' ? ' — is MySQL running in XAMPP?' : err.code === 'ER_BAD_DB_ERROR' ? ' — run: npm run setup-db' : ''
  res.status(500).json({ error: 'Server error' + hint })
})

app.listen(PORT, () => {
  console.log(`AutoCare API running at http://localhost:${PORT}`)
})
