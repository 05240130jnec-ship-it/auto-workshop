// routes/shop.js — URLs under /api/shop (customer shop). The work is done in controllers/shopController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const shop = require('../controllers/shopController');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only logged-in customers

router.get('/parts', shop.parts);                             // parts in stock
router.get('/reservations', shop.myReservations);             // my reservations
router.post('/reservations', shop.reserve);                   // reserve a part
router.patch('/reservations/:id', shop.cancelReservation);    // cancel (stock goes back)
router.get('/listings', shop.myListings);                     // my listings
router.post('/listings', shop.createListing);                 // sell a part (admin approves it)

module.exports = router;
