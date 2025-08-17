const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const User = require('../models/User');

router.use(protect, admin);

router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
  const users = await User.find({}, 'name email').limit(limit).sort({ name: 1 });
  res.json({ users });
});

module.exports = router;
