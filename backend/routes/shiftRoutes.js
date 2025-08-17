// backend/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();

const {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
} = require('../controllers/shiftController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// list + filters + pagination
router.get('/', protect, getShifts);

// create (admin)
router.post('/', protect, admin, addShift);

// update (admin) — 13.2
router.put('/:id', protect, admin, updateShift);

// delete (admin) — 13.3
router.delete('/:id', protect, admin, deleteShift);

module.exports = router;
