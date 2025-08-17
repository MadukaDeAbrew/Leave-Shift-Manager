const Shift = require('../models/Shift');
const User = require('../models/User');

const assignShift = async (req, res) => {
  try {
    const { userId, date, startTime, endTime, role } = req.body;

    if (!userId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const shiftDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // strip time for fair comparison

    if (shiftDate < today) {
      return res.status(400).json({ message: 'Shift date cannot be in the past' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const shift = await Shift.create({
      user: userId,
      date: shiftDate,
      startTime,
      endTime,
      role: role || user.role,
    });

    res.status(201).json({ message: 'Shift assigned successfully', shift });
  } catch (err) {
    console.error('assignShift error:', err);
    res.status(500).json({ message: 'Failed to assign shift' });
  }
};


module.exports = { assignShift };
