// backend/controllers/shiftController.js
const Shift = require('../models/Shift');
const User = require('../models/User');

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM
const toMinutes = (t) => {
  if (!TIME_RE.test(t)) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const overlapsAny = (existing, sMin, eMin) =>
  existing.some(({ startTime, endTime }) => {
    const s2 = toMinutes(startTime);
    const e2 = toMinutes(endTime);
    if (Number.isNaN(s2) || Number.isNaN(e2)) return false;
    return Math.max(sMin, s2) < Math.min(eMin, e2); // true overlap, edges ok
  });

/** GET /api/shifts (admin: all, user: own, paginated) */
const getShifts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const filter = isAdmin ? {} : { userId: req.user.id };
    const q = Shift.find(filter)
      .populate('userId', 'name email')
      .sort({ shiftDate: -1, startTime: 1 })
      .skip(skip)
      .limit(limit);

    const [shifts, total] = await Promise.all([q.exec(), Shift.countDocuments(filter)]);
    res.json({ shifts, page, pages: Math.ceil(total / limit) || 1, total, limit });
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ message: 'Failed to load shifts.' });
  }
};

/** POST /api/shifts (admin) */
/** POST /api/shifts (admin) */
// POST /api/shifts (admin only)
const addShift = async (req, res) => {
  try {
    // Guard: make sure req.user exists
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: missing user context' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add shifts' });
    }

    let { userId, userEmail, shiftDate, startTime, endTime, role, allowPast, step15 } = req.body;

    // If userId isn’t provided but userEmail is, resolve it
    if (!userId && userEmail) {
      const assignee = await User.findOne({ email: (userEmail || '').trim().toLowerCase() }).select('_id');
      if (!assignee) {
        return res.status(400).json({ message: 'Assignee email not found' });
      }
      userId = assignee._id;
    }

    if (!userId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'userId, shiftDate, startTime, endTime are required' });
    }

    // Validate times
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      return res.status(400).json({ message: 'Time must be in HH:MM format' });
    }
    const sMin = toMinutes(startTime);
    const eMin = toMinutes(endTime);
    if (sMin >= eMin) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }
    if (step15 && ((sMin % 15 !== 0) || (eMin % 15 !== 0))) {
      return res.status(400).json({ message: 'Times must be on 15-minute increments' });
    }

    // Validate date (YYYY-MM-DD)
    const date = new Date(shiftDate);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid shiftDate' });
    }
    date.setHours(0,0,0,0);

    const today = new Date(); today.setHours(0,0,0,0);
    if (!allowPast && date < today) {
      return res.status(400).json({ message: 'Shift date cannot be in the past' });
    }

    // Overlap check
    const sameDay = await Shift.find({ userId, shiftDate: date });
    if (overlapsAny(sameDay, sMin, eMin)) {
      return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

    // Create
    const shift = await Shift.create({
      userId,
      shiftDate: date,
      startTime,
      endTime,
      role: (role || '').trim(),
      status: 'Scheduled',
    });

    return res.status(201).json(shift);
  } catch (err) {
    console.error('addShift error:', err?.stack || err);
    // Surface a clearer error to the client
    return res.status(500).json({ message: 'Server error while creating shift.' });
  }
};


/** PUT /api/shifts/:id (admin) */
const updateShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can update shifts' });

    const { id } = req.params;
    const { userId, shiftDate, startTime, endTime, role, status, allowPast, step15 } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const newUserId = userId ?? shift.userId;
    const newDate   = shiftDate ? new Date(shiftDate) : new Date(shift.shiftDate);
    const newStart  = startTime ?? shift.startTime;
    const newEnd    = endTime ?? shift.endTime;

    if (!TIME_RE.test(newStart) || !TIME_RE.test(newEnd))
      return res.status(400).json({ message: 'Time must be HH:MM' });

    const sMin = toMinutes(newStart);
    const eMin = toMinutes(newEnd);
    if (sMin >= eMin) return res.status(400).json({ message: 'startTime must be before endTime' });
    if (step15 && ((sMin % 15 !== 0) || (eMin % 15 !== 0)))
      return res.status(400).json({ message: 'Times must be on 15-minute increments' });

    if (Number.isNaN(newDate.getTime())) return res.status(400).json({ message: 'Invalid shiftDate' });
    newDate.setHours(0,0,0,0);

    const today = new Date(); today.setHours(0,0,0,0);
    if (!allowPast && newDate < today) return res.status(400).json({ message: 'Shift date cannot be in the past' });

    const sameDay = await Shift.find({ userId: newUserId, shiftDate: newDate, _id: { $ne: id } });
    if (overlapsAny(sameDay, sMin, eMin))
      return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });

    shift.userId    = newUserId;
    shift.shiftDate = newDate;
    shift.startTime = newStart;
    shift.endTime   = newEnd;
    if (role   !== undefined) shift.role   = role;
    if (status !== undefined) shift.status = status;

    const saved = await shift.save();
    res.json(saved);
  } catch (err) {
    console.error('updateShift error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/** DELETE /api/shifts/:id (admin) */
const deleteShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can delete shifts' });
    const { id } = req.params;
    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    await shift.deleteOne();
    res.json({ message: 'Shift deleted' });
  } catch (err) {
    console.error('deleteShift error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /api/shifts/:id/status (admin) */
const updateShiftStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can update shift status' });
    const { id } = req.params;
    const { status } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (status) shift.status = status;
    const saved = await shift.save();
    res.json(saved);
  } catch (err) {
    console.error('updateShiftStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/** GET /api/shifts/available-for-swap */
const getAvailableForSwap = async (req, res) => {
  try {
    const { excludeShiftId } = req.query;
    const source = excludeShiftId ? await Shift.findById(excludeShiftId) : null;

    const filter = {
      ...(source ? { shiftDate: source.shiftDate } : {}),
      userId: { $ne: req.user.id },
      ...(excludeShiftId ? { _id: { $ne: excludeShiftId } } : {}),
    };

    const list = await Shift.find(filter)
      .populate('userId', 'name email')
      .sort({ shiftDate: 1, startTime: 1 });

    res.json(list);
  } catch (err) {
    console.error('getAvailableForSwap error:', err);
    res.status(500).json({ message: 'Failed to load swap options.' });
  }
};

module.exports = {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
  updateShiftStatus,
  getAvailableForSwap,
};
