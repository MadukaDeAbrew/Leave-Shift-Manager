// backend/routes/swapRoutes.js
const express = require('express');
const router = express.Router();
const { createSwap, listMine, listAll, cancelMine, updateStatus } = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// user creates
router.post('/', protect, createSwap);
// user lists own
router.get('/mine', protect, listMine);
// admin lists all
router.get('/', protect, admin, listAll);
// user cancels own (delete)
router.delete('/:id', protect, cancelMine);
// admin sets status
router.patch('/:id/status', protect, admin, updateStatus);

module.exports = router;
