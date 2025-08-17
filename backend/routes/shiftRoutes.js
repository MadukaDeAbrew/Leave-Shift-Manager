const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const {
  getShifts, addShift, updateShift, deleteShift, updateShiftStatus, getAvailableForSwap
} = require('../controllers/shiftController');

router.use(protect);               // sets req.user

router.get('/', getShifts);
router.post('/', admin, addShift); // admin guard AFTER protect
router.put('/:id', admin, updateShift);
router.delete('/:id', admin, deleteShift);
router.patch('/:id/status', admin, updateShiftStatus);
router.get('/available-for-swap', getAvailableForSwap);

module.exports = router;
