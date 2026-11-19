// routes/content.js — URLs under /api/content (website content from MySQL).
// The work is done in controllers/contentController.js
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const content = require('../controllers/contentController');

const router = express.Router();
const adminOnly = [requireAuth, requireRole('admin')];

// Anyone can read (the public website needs it, even before login)
router.get('/services', content.activeServices);
router.get('/services-all', requireAuth, requireRole('admin', 'mechanic'), content.allServices);
router.get('/services/:slug', content.oneService);
router.get('/offers', content.currentOffers);
router.get('/products', content.products);              // ?category=Auto Parts
router.get('/products/:sku', content.oneProduct);
router.get('/settings', content.getSettings);

// Only the admin can change services, offers and settings
// (shop products are inventory parts: the admin edits them on the Inventory page)
router.get('/admin/services', ...adminOnly, content.allServices);
router.post('/admin/services', ...adminOnly, content.createService);
router.patch('/admin/services/:id', ...adminOnly, content.updateService);
router.delete('/admin/services/:id', ...adminOnly, content.deleteService);

router.get('/admin/offers', ...adminOnly, content.allOffers);
router.post('/admin/offers', ...adminOnly, content.createOffer);
router.patch('/admin/offers/:id', ...adminOnly, content.updateOffer);
router.delete('/admin/offers/:id', ...adminOnly, content.deleteOffer);

router.patch('/admin/settings', ...adminOnly, content.updateSettings);

module.exports = router;
