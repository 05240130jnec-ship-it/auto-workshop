// 1. Load the tools
require('dotenv').config();          // read settings from .env
const express = require('express');
const cors = require('cors');

// 2. Create the app
const app = express();
app.use(cors());                     // allow the React site to call us
app.use(express.json());             // understand JSON sent by the frontend

// 3. A test route: GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AutoConnection backend is running' });
});

// 4. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});