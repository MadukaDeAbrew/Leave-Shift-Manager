const express = require('express');
const router = express.Router();

const {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
} = require('../controllers/leaveController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// List leaves
router.get('/', protect, getLeaves);

// Create leave (user)
router.post('/', protect, createLeave);

// Update leave (admin)
router.put('/:id', protect, updateLeave);

// Delete leave (admin)
router.delete('/:id', protect, deleteLeave);

// Approvals (admin only)
router.patch('/:id/approve', protect, admin, approveLeave);
router.patch('/:id/reject', protect, admin, rejectLeave);

module.exports = router;
