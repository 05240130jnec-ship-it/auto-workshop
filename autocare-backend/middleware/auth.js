// middleware/auth.js — checks the login token before protected routes run.
const jwt = require('jsonwebtoken');

// 1. Is the user logged in?  (reads "Authorization: Bearer <token>")
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, name, email }
    next();                                               // token OK → continue to the route
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

// 2. Does the user have the right role?  e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };