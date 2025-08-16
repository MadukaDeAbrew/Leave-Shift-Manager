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
const role = require('../middleware/roleMiddleware');

// Protect all /api/leaves routes
router.use(protect);

// User-level routes
router.get('/', getLeaves);
router.post('/', createLeave);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);

// Admin-only routes
router.patch('/:id/approve', role('admin'), approveLeave);
router.patch('/:id/reject', role('admin'), rejectLeave);

module.exports = router;
