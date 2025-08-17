// backend/routes/swapRoutes.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

const {
  createSwap,
  listSwaps,
  approveSwap,
  rejectSwap,
  cancelSwap,
} = require('../controllers/swapController');

// Create + List
router.post('/', protect, createSwap);
router.get('/', protect, listSwaps);

// Actions
router.patch('/:id/approve', protect, admin, approveSwap);
router.patch('/:id/reject',  protect, admin, rejectSwap);
router.patch('/:id/cancel',  protect, cancelSwap);

module.exports = router;
