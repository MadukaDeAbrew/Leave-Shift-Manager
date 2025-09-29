// backend/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();
const ShiftServer = require('../shiftserver');

const {
  getShifts,
  getUnassigned,
  addShift,
  updateShift,
  deleteShift,
  assignShift,
} = require('../controllers/shiftController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// list + filters + pagination
router.get('/', protect, getShifts);
router.get('/unassigned', protect, admin, getUnassigned);

// create (admin)
router.post('/', protect, admin, addShift);

// update (admin) — 13.2
router.put('/:id', protect, admin, updateShift);

// delete (admin) — 13.3
router.delete('/:id', protect, admin, deleteShift);

//assgin (admin)
router.post('/:id/assign', protect, admin, assignShift);

module.exports = router;
