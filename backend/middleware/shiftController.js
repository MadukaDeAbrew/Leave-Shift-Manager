// backend/controllers/shiftController.js
const Shift = require('../models/Shift');

// ---------------- Helpers ----------------
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

function toMinutes(hhmm) {
  if (!TIME_RE.test(hhmm)) return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Check any overlap between [s1,e1) and existing [s2,e2) */
function overlapsAny(existing, sMin, eMin) {
  return existing.some(({ startTime, endTime }) => {
    const s2 = toMinutes(startTime);
    const e2 = toMinutes(endTime);
    if (Number.isNaN(s2) || Number.isNaN(e2)) return false;
    // Overlap if max(start) < min(end); touching edges is OK
    return Math.max(sMin, s2) < Math.min(eMin, e2);
  });
}

// ---------------- Controllers ----------------

/**
 * GET /api/shifts
 * Admin: list all (paginated)
 * User: list their own
 */
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

    const [shifts, total] = await Promise.all([
      q.exec(),
      Shift.countDocuments(filter),
    ]);

    res.json({
      shifts,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
      limit,
    });
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ message: 'Failed to load shifts.' });
  }
};

/**
 * POST /api/shifts  (admin only)
 * Body: { userId, shiftDate, startTime, endTime, role?, allowPast?, step15? }
 */
const addShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add shifts' });
    }

    const {
      userId,
      shiftDate,
      startTime,
      endTime,
      role,
      allowPast, // optional boolean
      step15,    // optional boolean
    } = req.body;

    if (!userId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'userId, shiftDate, startTime, endTime are required' });
    }

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

    const date = new Date(shiftDate);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid shiftDate' });
    }
    date.setHours(0, 0, 0, 0);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!allowPast && date < today) {
      return res.status(400).json({ message: 'Shift date cannot be in the past' });
    }

    // Overlap check for this user on this date
    const sameDayShifts = await Shift.find({ userId, shiftDate: date });
    if (overlapsAny(sameDayShifts, sMin, eMin)) {
      return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

    const shift = await Shift.create({
      userId,
      shiftDate: date,
      startTime,
      endTime,
      role: role || '',
      status: 'Scheduled',
    });

    return res.status(201).json(shift);
  } catch (err) {
    console.error('addShift error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/shifts/:id  (admin only)
 * Body: may include userId, shiftDate, startTime, endTime, role, status, allowPast?, step15?
 */
const updateShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update shifts' });
    }

    const { id } = req.params;
    const { userId, shiftDate, startTime, endTime, role, status, allowPast, step15 } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const newUserId = userId ?? shift.userId;
    const newDate   = shiftDate ? new Date(shiftDate) : new Date(shift.shiftDate);
    const newStart  = startTime ?? shift.startTime;
    const newEnd    = endTime ?? shift.endTime;

    if (!TIME_RE.test(newStart) || !TIME_RE.test(newEnd)) {
      return res.status(400).json({ message: 'Time must be in HH:MM format' });
    }

    const sMin = toMinutes(newStart);
    const eMin = toMinutes(newEnd);
    if (sMin >= eMin) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    if (step15 && ((sMin % 15 !== 0) || (eMin % 15 !== 0))) {
      return res.status(400).json({ message: 'Times must be on 15-minute increments' });
    }

    if (Number.isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'Invalid shiftDate' });
    }
    newDate.setHours(0, 0, 0, 0);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!allowPast && newDate < today) {
      return res.status(400).json({ message: 'Shift date cannot be in the past' });
    }

    // Overlap check (exclude the current shift id)
    const sameDayShifts = await Shift.find({
      userId: newUserId,
      shiftDate: newDate,
      _id: { $ne: id },
    });
    if (overlapsAny(sameDayShifts, sMin, eMin)) {
      return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

    // Apply updates
    shift.userId    = newUserId;
    shift.shiftDate = newDate;
    shift.startTime = newStart;
    shift.endTime   = newEnd;
    if (role   !== undefined) shift.role   = role;
    if (status !== undefined) shift.status = status;

    const saved = await shift.save();
    return res.json(saved);
  } catch (err) {
    console.error('updateShift error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/shifts/:id  (admin only)
 */
const deleteShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete shifts' });
    }
    const { id } = req.params;
    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    await shift.deleteOne();
    return res.json({ message: 'Shift deleted' });
  } catch (err) {
    console.error('deleteShift error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PATCH /api/shifts/:id/status  (admin only)
 * Body: { status }
 */
const updateShiftStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update shift status' });
    }
    const { id } = req.params;
    const { status } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (status) shift.status = status;
    const saved = await shift.save();
    return res.json(saved);
  } catch (err) {
    console.error('updateShiftStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/shifts/available-for-swap
 * Query: ?excludeShiftId=<id>
 * Returns other users' shifts you could swap with (simple example: same day; no ownership).
 * Adjust logic as needed.
 */
const getAvailableForSwap = async (req, res) => {
  try {
    const { excludeShiftId } = req.query;

    // Load the source shift (to exclude & to match date)
    const source = excludeShiftId ? await Shift.findById(excludeShiftId) : null;

    const filter = {
      ...(source
        ? { shiftDate: source.shiftDate }
        : {}),
      userId: { $ne: req.user.id }, // only show other users' shifts
    };

    if (excludeShiftId) {
      filter._id = { $ne: excludeShiftId };
    }

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
  getAvailableForSwap, // optional helper used by your UI
};
