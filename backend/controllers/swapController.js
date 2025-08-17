// backend/controllers/swapController.js
const SwapRequest = require('../models/SwapRequest');
const Shift = require('../models/Shift');

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM
const toMin = (t) => {
  if (!TIME_RE.test(t)) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const overlapsAny = (existing, sMin, eMin) =>
  existing.some(({ startTime, endTime }) => {
    const s2 = toMin(startTime);
    const e2 = toMin(endTime);
    if (Number.isNaN(s2) || Number.isNaN(e2)) return false;
    return Math.max(sMin, s2) < Math.min(eMin, e2);
  });

/**
 * POST /api/swaps
 * body: { fromShiftId, toShiftId, reason? }
 * - Must be the owner of fromShift
 * - Shifts must be on the same date (simple policy)
 */
const createSwap = async (req, res) => {
  try {
    const { fromShiftId, toShiftId, reason } = req.body;
    if (!fromShiftId || !toShiftId) {
      return res.status(400).json({ message: 'fromShiftId and toShiftId are required' });
    }
    if (fromShiftId === toShiftId) {
      return res.status(400).json({ message: 'Cannot swap a shift with itself' });
    }

    const [fromShift, toShift] = await Promise.all([
      Shift.findById(fromShiftId),
      Shift.findById(toShiftId),
    ]);
    if (!fromShift || !toShift) return res.status(404).json({ message: 'Shift not found' });

    if (String(fromShift.userId) !== req.user.id) {
      return res.status(403).json({ message: 'You can only request swaps for your own shift' });
    }
    if (String(toShift.userId) === req.user.id) {
      return res.status(400).json({ message: 'Cannot swap with your own shift' });
    }

    const d1 = new Date(fromShift.shiftDate); d1.setHours(0,0,0,0);
    const d2 = new Date(toShift.shiftDate);   d2.setHours(0,0,0,0);
    if (d1.getTime() !== d2.getTime()) {
      return res.status(400).json({ message: 'Shifts must be on the same date to swap' });
    }

    const swap = await SwapRequest.create({
      requester: req.user.id,
      fromShift: fromShift._id,
      toShift: toShift._id,
      reason: reason || '',
      status: 'Pending',
    });

    const populated = await SwapRequest.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } });

    res.status(201).json(populated);
  } catch (err) {
    console.error('createSwap error:', err);
    res.status(500).json({ message: 'Failed to create swap request.' });
  }
};

/**
 * GET /api/swaps
 * - Admin: all
 * - User: only swaps they created (requester)
 * Query: page, limit, status?
 */
const listSwaps = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const filter = isAdmin ? {} : { requester: req.user.id };
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

    const q = SwapRequest.find(filter)
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [rows, total] = await Promise.all([q.exec(), SwapRequest.countDocuments(filter)]);
    res.json({ swaps: rows, page, pages: Math.ceil(total / limit) || 1, total, limit });
  } catch (err) {
    console.error('listSwaps error:', err);
    res.status(500).json({ message: 'Failed to load swap requests.' });
  }
};

/**
 * PATCH /api/swaps/:id/approve  (admin)
 * - swap user assignments between the two shifts
 * - basic overlap safety checks
 */
const approveSwap = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    const swap = await SwapRequest.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot approve a ${swap.status} request` });
    }

    const [a, b] = await Promise.all([
      Shift.findById(swap.fromShift),
      Shift.findById(swap.toShift),
    ]);
    if (!a || !b) return res.status(404).json({ message: 'Shift not found' });

    // Same-day policy already enforced at creation, but keep safe:
    const d1 = new Date(a.shiftDate); d1.setHours(0,0,0,0);
    const d2 = new Date(b.shiftDate); d2.setHours(0,0,0,0);
    if (d1.getTime() !== d2.getTime()) {
      return res.status(400).json({ message: 'Shifts must be on the same date to swap' });
    }

    const aUser = a.userId;
    const bUser = b.userId;

    // Overlap checks: A takes B; B takes A
    const sB = toMin(b.startTime), eB = toMin(b.endTime);
    const sA = toMin(a.startTime), eA = toMin(a.endTime);

    const [aDayOthers, bDayOthers] = await Promise.all([
      Shift.find({ userId: aUser, shiftDate: d2, _id: { $ne: a._id } }),
      Shift.find({ userId: bUser, shiftDate: d1, _id: { $ne: b._id } }),
    ]);

    if (overlapsAny(aDayOthers, sB, eB)) {
      return res.status(409).json({ message: 'Approval would cause overlap for user A on that day' });
    }
    if (overlapsAny(bDayOthers, sA, eA)) {
      return res.status(409).json({ message: 'Approval would cause overlap for user B on that day' });
    }

    // Perform the swap
    a.userId = bUser;
    b.userId = aUser;
    await Promise.all([a.save(), b.save()]);

    swap.status = 'Approved';
    await swap.save();

    const populated = await SwapRequest.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } });

    res.json(populated);
  } catch (err) {
    console.error('approveSwap error:', err);
    res.status(500).json({ message: 'Failed to approve swap.' });
  }
};

/**
 * PATCH /api/swaps/:id/reject  (admin)
 */
const rejectSwap = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    const swap = await SwapRequest.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot reject a ${swap.status} request` });
    }

    swap.status = 'Rejected';
    await swap.save();

    const populated = await SwapRequest.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } });

    res.json(populated);
  } catch (err) {
    console.error('rejectSwap error:', err);
    res.status(500).json({ message: 'Failed to reject swap.' });
  }
};

/**
 * PATCH /api/swaps/:id/cancel  (requester only, while Pending)
 */
const cancelSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const swap = await SwapRequest.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot cancel a ${swap.status} request` });
    }
    if (String(swap.requester) !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can cancel this swap' });
    }

    swap.status = 'Cancelled';
    await swap.save();

    const populated = await SwapRequest.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } });

    res.json(populated);
  } catch (err) {
    console.error('cancelSwap error:', err);
    res.status(500).json({ message: 'Failed to cancel swap.' });
  }
};

module.exports = {
  createSwap,
  listSwaps,
  approveSwap,
  rejectSwap,
  cancelSwap,
};
