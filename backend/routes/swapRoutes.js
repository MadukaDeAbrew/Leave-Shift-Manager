const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listSwaps,
  createSwap,
  approveSwap,
  rejectSwap,
  cancelSwap,
} = require('../controllers/swapController');

router.get('/', protect, listSwaps);
router.post('/', protect, createSwap);
router.patch('/:id/approve', protect, approveSwap);
router.patch('/:id/reject',  protect, rejectSwap);
router.delete('/:id', protect, cancelSwap);

module.exports = router;
