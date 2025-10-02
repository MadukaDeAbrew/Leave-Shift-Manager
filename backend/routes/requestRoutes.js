// backend/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

const {
  getLeaves,
  approveRequest,
  rejectRequest,
} = require('../controllers/requestController');


// Protect everything in this router
router.use(protect);

// List leaves (admin: all; user: own) with optional ?status=&page=&limit=
router.get('/', getLeaves);

// Admin decisions
// Admin-only decisions
router.patch('/:id/approve', admin, approveRequest);
router.patch('/:id/reject',  admin, rejectRequest);

module.exports = router;
