// backend/controllers/shiftController.js
const Shift = require('../models/Shift');
const User  = require('../models/User');

/* ---------------------------- Helpers ---------------------------- */

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

function toMinutes(hhmm) {
  if (!TIME_RE.test(hhmm)) return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function normalizeDateOnly(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Check any overlap between [s1,e1) and existing [s2,e2) */
function overlapsAny(existing, sMin, eMin) {
  return existing.some(({ startTime, endTime }) => {
    const s2 = toMinutes(startTime);
    const e2 = toMinutes(endTime);
    if (Number.isNaN(s2) || Number.isNaN(e2)) return false;
    return Math.max(sMin, s2) < Math.min(eMin, e2); // touching edges ok
  });
}

/* --------------------------- Controllers ------------------------- */

/**
 * GET /api/shifts
 * Admin: all; User: own
 * Filters: ?start=YYYY-MM-DD&end=YYYY-MM-DD&role=Cashier&status=Scheduled
 */
const getShifts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const filter = isAdmin ? {} : { userId: req.user.id };

    if (req.query.start || req.query.end) {
      const start = req.query.start ? normalizeDateOnly(req.query.start) : null;
      const end   = req.query.end   ? normalizeDateOnly(req.query.end)   : null;
      if (start && end) filter.shiftDate = { $gte: start, $lte: end };
      else if (start)  filter.shiftDate = { $gte: start };
      else if (end)    filter.shiftDate = { $lte: end };
    }

    if (req.query.role && req.query.role.trim()) {
      filter.role = { $regex: req.query.role.trim(), $options: 'i' };
    }
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

    const query = Shift.find(filter)
      .populate('userId', 'name email')
      .sort({ shiftDate: -1, startTime: 1 })
      .skip(skip)
      .limit(limit);

    const [shifts, total] = await Promise.all([
      query.exec(),
      Shift.countDocuments(filter),
    ]);

    res.json({ shifts, page, pages: Math.ceil(total / limit) || 1, total, limit });
  } catch (err) {
    console.error('getShifts error:', err);
    res.status(500).json({ message: 'Failed to load shifts.' });
  }
};

/**
 * POST /api/shifts (admin)
 * Body: { userId?, userEmail?, shiftDate, startTime, endTime, role?, allowPast?, step15? }
 */
const addShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can add shifts' });

    let { userId, userEmail, shiftDate, startTime, endTime, role, allowPast, step15 } = req.body;

    // resolve by email if provided
    if (!userId && userEmail) {
      const u = await User.findOne({ email: userEmail.trim().toLowerCase() });
      if (u) userId = u._id.toString();
    }

    if (!shiftDate || !startTime || !endTime)
      return res.status(400).json({ message: 'shiftDate, startTime, endTime are required' });

    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime))
      return res.status(400).json({ message: 'Time must be in HH:MM format' });

    const sMin = toMinutes(startTime);
    const eMin = toMinutes(endTime);
    if (sMin >= eMin) return res.status(400).json({ message: 'startTime must be before endTime' });

    if (step15 && ((sMin % 15 !== 0) || (eMin % 15 !== 0)))
      return res.status(400).json({ message: 'Times must be on 15-minute increments' });

    const date = normalizeDateOnly(shiftDate);
    if (!date) return res.status(400).json({ message: 'Invalid shiftDate' });

    const today = new Date(); today.setHours(0,0,0,0);
    if (!allowPast && date < today) return res.status(400).json({ message: 'Shift date cannot be in the past' });

    // Overlap only when an assignee exists
    if (userId) {
      const sameDay = await Shift.find({ userId, shiftDate: date });
      if (overlapsAny(sameDay, sMin, eMin))
        return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

    const shift = await Shift.create({
      userId: userId || null,
      shiftDate: date,
      startTime,
      endTime,
      role: role || '',
      status: 'Scheduled',
    });

    res.status(201).json(shift);
  } catch (err) {
    console.error('addShift error:', err);
    res.status(500).json({ message: 'Server error creating shift' });
  }
};

/**
 * PUT /api/shifts/:id (admin)
 * Body: may include userId|null, userEmail, shiftDate, startTime, endTime, role, status, allowPast?, step15?
 */
const updateShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can update shifts' });

    const { id } = req.params;
    let { userId, userEmail, shiftDate, startTime, endTime, role, status, allowPast, step15 } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (userId === undefined && userEmail) {
      const u = await User.findOne({ email: userEmail.trim().toLowerCase() });
      if (u) userId = u._id.toString();
    }

    const next = {
      userId: userId !== undefined ? userId : shift.userId, // allow null to unassign
      shiftDate: shiftDate ? normalizeDateOnly(shiftDate) : normalizeDateOnly(shift.shiftDate),
      startTime: startTime ?? shift.startTime,
      endTime:   endTime   ?? shift.endTime,
      role:      role !== undefined ? role : shift.role,
      status:    status !== undefined ? status : shift.status,
    };

    if (!next.shiftDate) return res.status(400).json({ message: 'Invalid shiftDate' });
    if (!TIME_RE.test(next.startTime) || !TIME_RE.test(next.endTime))
      return res.status(400).json({ message: 'Time must be in HH:MM format' });

    const sMin = toMinutes(next.startTime);
    const eMin = toMinutes(next.endTime);
    if (sMin >= eMin) return res.status(400).json({ message: 'startTime must be before endTime' });
    if (step15 && ((sMin % 15 !== 0) || (eMin % 15 !== 0)))
      return res.status(400).json({ message: 'Times must be on 15-minute increments' });

    const today = new Date(); today.setHours(0,0,0,0);
    if (!allowPast && next.shiftDate < today) return res.status(400).json({ message: 'Shift date cannot be in the past' });

    if (next.userId) {
      const sameDay = await Shift.find({
        userId: next.userId,
        shiftDate: next.shiftDate,
        _id: { $ne: id },
      });
      if (overlapsAny(sameDay, sMin, eMin))
        return res.status(409).json({ message: 'Shift overlaps an existing assignment for this user on this date' });
    }

    shift.userId    = next.userId || null;
    shift.shiftDate = next.shiftDate;
    shift.startTime = next.startTime;
    shift.endTime   = next.endTime;
    shift.role      = next.role;
    shift.status    = next.status;

    const saved = await shift.save();
    res.json(saved);
  } catch (err) {
    console.error('updateShift error:', err);
    res.status(500).json({ message: 'Server error updating shift' });
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
    res.status(500).json({ message: 'Server error deleting shift' });
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
    res.status(500).json({ message: 'Server error updating shift status' });
  }
};

/**
 * GET /api/shifts/available-for-swap
 * Query:
 *   excludeShiftId=<id>         (recommended)
 *   sameDay=true|false          default true; false => whole list (optionally filtered by start/end)
 *   start=YYYY-MM-DD            optional (when sameDay=false)
 *   end=YYYY-MM-DD              optional (when sameDay=false)
 *   role=<string>               optional (regex contains)
 *   status=<Scheduled|...|All>  optional; default Scheduled
 *   includeUnassigned=true|false default true
 *   includeSelf=true|false       default false
 */
// Replace your current getAvailableForSwap with this version (if not already similar)
const getAvailableForSwap = async (req, res) => {
  try {
    const {
      excludeShiftId,
      sameDay = 'false',
      start,
      end,
      role,
      status = 'Scheduled',
    } = req.query;

    const exclude = excludeShiftId ? await Shift.findById(excludeShiftId) : null;

    const filter = {};
    if (sameDay === 'true' && exclude?.shiftDate) {
      filter.shiftDate = exclude.shiftDate;
    } else {
      if (start) filter.shiftDate = { ...(filter.shiftDate || {}), $gte: new Date(start) };
      if (end)   filter.shiftDate = { ...(filter.shiftDate || {}), $lte: new Date(end) };
    }

    // show other users’ shifts + unassigned shifts (null) but not the caller’s shift
    filter.$or = [{ userId: { $ne: req.user.id } }, { userId: { $exists: false } }, { userId: null }];
    if (excludeShiftId) filter._id = { $ne: excludeShiftId };
    if (role) filter.role = role;
    if (status && status !== 'All') filter.status = status;

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
