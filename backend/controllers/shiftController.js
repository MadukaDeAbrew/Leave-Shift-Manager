// backend/controllers/shiftController.js
const mongoose = require('mongoose');
const { Types } = mongoose;

const Shift = require('../models/Shift');
const User  = require('../models/User');

// -------- Helpers --------
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

function toMinutes(t) {
  if (!TIME_RE.test(t)) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** true overlap if max(start) < min(end); touching edges is OK */
function overlapsAny(existing, sMin, eMin) {
  return existing.some(({ startTime, endTime }) => {
    const s2 = toMinutes(startTime);
    const e2 = toMinutes(endTime);
    if (Number.isNaN(s2) || Number.isNaN(e2)) return false;
    return Math.max(sMin, s2) < Math.min(eMin, e2);
  });
}

// -------- Controllers --------

/**
 * GET /api/shifts
 * Admin: list all (paginated)
 * User: list their own (paginated)
 */
// backend/controllers/shiftController.js
const getShifts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';

    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    // base scope
    const filter = isAdmin ? {} : { userId: req.user.id };

    // ---- DATE FILTERS (inclusive) ----
    // expect YYYY-MM-DD from the UI
    const { start, end } = req.query;
    if (start || end) {
      filter.shiftDate = {};
      if (start) {
        const d = new Date(start);
        d.setHours(0, 0, 0, 0);
        filter.shiftDate.$gte = d;
      }
      if (end) {
        const d = new Date(end);
        // make end inclusive by pushing to end-of-day
        d.setHours(23, 59, 59, 999);
        filter.shiftDate.$lte = d;
      }
    }

    // ---- ROLE FILTER (case-insensitive contains) ----
    if (req.query.role && req.query.role.trim()) {
      filter.role = { $regex: req.query.role.trim(), $options: 'i' };
    }

    // ---- STATUS FILTER (exact) ----
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

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
 * Body: { userId?, userEmail?, shiftDate, startTime, endTime, role, allowPast?, step15? }
 * If userId not provided, userEmail can be used to resolve.
 */
async function addShift(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add shifts' });
    }

    let { userId, userEmail, shiftDate, startTime, endTime, role, allowPast, step15 } = req.body;

    // Resolve by email if provided
    if (!userId && userEmail) {
      const found = await User.findOne({ email: (userEmail || '').trim().toLowerCase() }, '_id');
      if (!found) return res.status(400).json({ message: 'User not found for provided email' });
      userId = String(found._id);
    }

    if (!userId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'userId, shiftDate, startTime, endTime are required' });
    }

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
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

    // Overlap check (same user, same date)
    const sameDay = await Shift.find({ userId, shiftDate: date });
    if (overlapsAny(sameDay, sMin, eMin)) {
      return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

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
    console.error('addShift error:', err);
    return res.status(500).json({ message: 'Server error creating shift', detail: err.message || String(err) });
  }
}

/**
 * PUT /api/shifts/:id  (admin only)
 * Body: may include userId, shiftDate, startTime, endTime, role, status, allowPast?, step15?
 */
async function updateShift(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update shifts' });
    }

    const { id } = req.params;
    const { userId, shiftDate, startTime, endTime, role, status, allowPast, step15 } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid shift id' });
    }

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const newUserId = userId ?? shift.userId;
    const newDate   = shiftDate ? new Date(shiftDate) : new Date(shift.shiftDate);
    const newStart  = startTime ?? shift.startTime;
    const newEnd    = endTime ?? shift.endTime;

    if (!Types.ObjectId.isValid(newUserId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

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

    // Overlap check (exclude current id)
    const sameDay = await Shift.find({
      userId: newUserId,
      shiftDate: newDate,
      _id: { $ne: id },
    });
    if (overlapsAny(sameDay, sMin, eMin)) {
      return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

    // Apply change(s)
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
    return res.status(500).json({ message: 'Server error updating shift', detail: err.message || String(err) });
  }
}

/**
 * DELETE /api/shifts/:id  (admin only)
 */
async function deleteShift(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete shifts' });
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid shift id' });
    }

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    await shift.deleteOne();
    return res.json({ message: 'Shift deleted' });
  } catch (err) {
    console.error('deleteShift error:', err);
    return res.status(500).json({ message: 'Server error deleting shift', detail: err.message || String(err) });
  }
}

/**
 * PATCH /api/shifts/:id/status  (admin only)
 * Body: { status }
 */
async function updateShiftStatus(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update shift status' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid shift id' });
    }

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (status) shift.status = status;
    const saved = await shift.save();
    return res.json(saved);
  } catch (err) {
    console.error('updateShiftStatus error:', err);
    return res.status(500).json({ message: 'Server error updating status', detail: err.message || String(err) });
  }
}

/**
 * GET /api/shifts/available-for-swap
 * Query: ?excludeShiftId=<id>
 */
async function getAvailableForSwap(req, res) {
  try {
    const { excludeShiftId } = req.query;

    const source = excludeShiftId && Types.ObjectId.isValid(excludeShiftId)
      ? await Shift.findById(excludeShiftId)
      : null;

    const filter = {
      ...(source ? { shiftDate: source.shiftDate } : {}),
      userId: { $ne: req.user.id }, // others' shifts only
      ...(excludeShiftId && Types.ObjectId.isValid(excludeShiftId)
        ? { _id: { $ne: excludeShiftId } }
        : {}),
    };

    const list = await Shift.find(filter)
      .populate('userId', 'name email')
      .sort({ shiftDate: 1, startTime: 1 });

    res.json(list);
  } catch (err) {
    console.error('getAvailableForSwap error:', err);
    res.status(500).json({ message: 'Failed to load swap options.', detail: err.message });
  }
}

module.exports = {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
  updateShiftStatus,
  getAvailableForSwap,
};
