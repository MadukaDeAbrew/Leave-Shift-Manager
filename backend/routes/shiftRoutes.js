const express = require('express');
const router = express.Router();

const {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
  updateShiftStatus,
  getAvailableForSwap, 
} = require('../controllers/shiftController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

const { listAvailableForSwap } = require('../controllers/shiftController');
router.get('/available-for-swap', protect, listAvailableForSwap);



// GET /api/shifts
router.get('/', protect, getShifts);

// POST /api/shifts (admin only)
router.post('/', protect, admin, addShift);

// PUT /api/shifts/:id (admin only)
router.put('/:id', protect, admin, updateShift);

// DELETE /api/shifts/:id (admin only)
router.delete('/:id', protect, admin, deleteShift);

// PATCH /api/shifts/:id/status (admin only)
router.patch('/:id/status', protect, admin, updateShiftStatus);

const { listAvailableForSwap } = require('../controllers/shiftController');
router.get('/available-for-swap', protect, listAvailableForSwap);
module.exports = router;
