// server.js — the main file of the backend.

// 1. Load the tools
require('dotenv').config();          // read settings from .env
const express = require('express');
const cors = require('cors');
const db = require('./db');          // our MySQL connection

// 2. Create the app
const app = express();
app.use(cors());                     // allow the React site to call us
app.use(express.json());             // understand JSON sent by the frontend

// 3. Home page
app.get('/', (req, res) => {
  res.send('AutoConnection API is running. Try /api/health');
});

// 4. Test the server: GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AutoConnection backend is running' });
});

// 5. Test the database: GET /api/db-test
app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SHOW TABLES');
    res.json({ connected: true, tables: rows.length });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});
// 6. Login / signup routes → /api/auth/...
app.use('/api/auth', require('./routes/auth'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/shop', require('./routes/shop'));
// 7. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
