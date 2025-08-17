// backend/routes/swapRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const {
  listSwaps,
  createSwap,
  approveSwap,
  rejectSwap,
  cancelSwap,
} = require('../controllers/swapController');

// List swaps
router.get('/', protect, listSwaps);

// Create swap request (user)
router.post('/', protect, createSwap);

// Approve/Reject (admin)
router.patch('/:id/approve', protect, admin, approveSwap);
router.patch('/:id/reject',  protect, admin, rejectSwap);

// Cancel by requester (or admin)
router.delete('/:id', protect, cancelSwap);

module.exports = router;
