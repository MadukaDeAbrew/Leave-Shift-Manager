// backend/routes/leaveRoutes.js
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

// Protect everything in this router
router.use(protect);

// List leaves (admin: all; user: own) with optional ?status=&page=&limit=
router.get('/', getLeaves);

// Create leave (user)
router.post('/', createLeave);

// Update leave (owner or admin)
router.put('/:id', updateLeave);

// Delete leave (owner if Pending, or admin)
router.delete('/:id', deleteLeave);

// Admin decisions
// Admin-only decisions
router.patch('/:id/approve', protect, admin, approveLeave);
router.patch('/:id/reject',  protect, admin, rejectLeave);

module.exports = router;
