const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

const {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
  updateShiftStatus,
  getAvailableForSwap,
} = require('../controllers/shiftController');

router.use(protect);

// Specific first
router.get('/available-for-swap', getAvailableForSwap);

// List + create
router.get('/', getShifts);
router.post('/', admin, addShift);

// Update/delete/status (admin)
router.put('/:id', admin, updateShift);
router.delete('/:id', admin, deleteShift);
router.patch('/:id/status', admin, updateShiftStatus);

module.exports = router;
