// Checks the login token on protected routes.
//
// The frontend sends:   Authorization: Bearer <token>
// If the token is valid we put the user on req.user = { id, role, name }
require('dotenv').config({ quiet: true })
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me'
if (!process.env.JWT_SECRET) console.warn('⚠ JWT_SECRET is not set in .env — using a development default.')

// Make a token for a user (valid for 1 day)
function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' })
}

// Use on any route that needs a logged-in user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Please log in first (no token sent)' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Your login has expired or is invalid. Please log in again.' })
  }
}

// Use after requireAuth to allow only some roles, e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Only ${roles.join(' / ')} can do this` })
    }
    next()
  }
}

module.exports = { createToken, requireAuth, requireRole }
