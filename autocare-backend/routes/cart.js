// routes/cart.js — URLs under /api/cart (the customer's shopping cart).
// The work is done in controllers/cartController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const cart = require('../controllers/cartController');

const router = express.Router();
router.use(requireAuth, requireRole('customer'));   // only logged-in customers

router.get('/', cart.getCart);                  // my cart
router.post('/', cart.addItem);                 // { partId, qty } add to cart
router.post('/checkout', cart.checkout);        // { pickup } order everything in the cart
router.patch('/:partId', cart.updateItem);      // { qty } change the quantity
router.delete('/:partId', cart.removeItem);     // remove from cart

module.exports = router;
