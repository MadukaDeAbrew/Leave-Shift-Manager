// backend/routes/swapRoutes.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// Import the controller as a single object to avoid name mismatches
const swapCtrl = require('../controllers/swapController');

// User & Admin can list/create
router.get('/',  protect, swapCtrl.listSwaps);
router.post('/', protect, swapCtrl.createSwap);

// Admin decisions
router.patch('/:id/approve', protect, admin, swapCtrl.approveSwap);
router.patch('/:id/reject',  protect, admin, swapCtrl.rejectSwap);

module.exports = router;
