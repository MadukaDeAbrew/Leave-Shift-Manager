// backend/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();
//const ShiftServer = require('../shiftserver');

const {
  getShifts,
  getUnassigned,
  addShift,
  updateShift,
  deleteShift,
  assignShift,
} = require('../controllers/shiftController');

const { protect,adminOnly} = require('../middleware/authMiddleware');


// list + filters + pagination
router.get('/', protect, getShifts);
router.get('/unassigned', protect, adminOnly, getUnassigned);

// create (admin)
router.post('/', protect, adminOnly, addShift);

// update (admin) — 13.2
router.put('/:id', protect, adminOnly, updateShift);

// delete (admin) — 13.3
router.delete('/:id', protect, adminOnly, deleteShift);

//assgin (admin)
router.post('/:id/assign', protect, adminOnly, assignShift);



module.exports = router;
