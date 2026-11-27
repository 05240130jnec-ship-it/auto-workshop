// routes/admin.js — URLs under /api/admin. The work is done in controllers/adminController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const admin = require('../controllers/adminController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));   // only admins

// Dashboard
router.get('/dashboard', admin.dashboard);

// Repairs  (?status=pending works on the list)
router.get('/repairs', admin.listRepairs);
router.get('/repairs/:id', admin.getRepair);
router.patch('/repairs/:id', admin.updateRepair);
router.post('/repairs', admin.createRepair);
router.delete('/repairs/:id', admin.deleteRepair);

// Mechanics
router.get('/mechanics', admin.listMechanics);
router.post('/mechanics', admin.createMechanic);
router.patch('/mechanics/:id', admin.updateMechanic);
router.delete('/mechanics/:id', admin.deleteMechanic);
router.patch('/mechanics/:id/password', admin.resetMechanicPassword);   // { password } new password from the admin

// Leave requests from mechanics
router.get('/leaves', admin.listLeaves);
router.patch('/leaves/:id', admin.decideLeave);              // approve / reject

// Customers (the admin can only block / unblock)
router.get('/customers', admin.listCustomers);
router.post('/customers', admin.createCustomer);
router.patch('/customers/:id', admin.updateCustomer);
router.delete('/customers/:id', admin.deleteCustomer);

// Inventory  (?low=1 -> only low stock)
router.get('/inventory', admin.listInventory);
router.post('/inventory', admin.createPart);
router.patch('/inventory/:id', admin.updatePart);
router.delete('/inventory/:id', admin.deletePart);

// Suppliers
router.get('/suppliers', admin.listSuppliers);
router.post('/suppliers', admin.createSupplier);
router.patch('/suppliers/:id', admin.updateSupplier);
router.delete('/suppliers/:id', admin.deleteSupplier);

// Purchase orders  (pending -> approved -> received)
router.get('/orders', admin.listOrders);
router.post('/orders', admin.createOrder);
router.patch('/orders/:id', admin.updateOrder);

// Shop: customer listings and reservations
router.get('/shop/listings', admin.listListings);
router.patch('/shop/listings/:id', admin.updateListing);
router.post('/shop/listings/:id/buy', admin.buyListing);      // bought -> becomes an inventory part
router.get('/shop/reservations', admin.listReservations);
router.patch('/shop/reservations/:id', admin.updateReservation);

// My profile (the admin who is logged in)
router.get('/profile', admin.getProfile);
router.patch('/profile', admin.updateProfile);
router.patch('/profile/password', admin.changePassword);

module.exports = router;
