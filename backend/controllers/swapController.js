// backend/controllers/swapController.js
const mongoose = require('mongoose');
const Swap = require('../models/Swap');
const Shift = require('../models/Shift');

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

/**
 * GET /api/swaps
 */
const listSwaps = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { requester: req.user.id };

    const swaps = await Swap.find(filter)
      .populate('requester', 'name email')
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch (err) {
    console.error('listSwaps error:', err);
    res.status(500).json({ message: 'Failed to load swap requests.' });
  }
};

/**
 * POST /api/swaps
 * Body: { fromShiftId, toShiftId, reason }
 */
const createSwap = async (req, res) => {
  try {
    const { fromShiftId, toShiftId, reason } = req.body || {};

    if (!fromShiftId || !toShiftId) {
      return res.status(400).json({ message: 'fromShiftId and toShiftId are required' });
    }
    if (!isObjectId(fromShiftId) || !isObjectId(toShiftId)) {
      return res.status(400).json({ message: 'Invalid shift id(s)' });
    }

    const [fromShift, toShift] = await Promise.all([
      Shift.findById(fromShiftId),
      Shift.findById(toShiftId),
    ]);

    if (!fromShift || !toShift) {
      return res.status(404).json({ message: 'Shift(s) not found' });
    }

    // requester must own the FROM shift (unless admin)
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      if (!fromShift.userId || String(fromShift.userId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'You can only request a swap for your own shift' });
      }
    }

    const swap = await Swap.create({
      requester: req.user.id,
      fromShiftId,
      toShiftId,
      reason: (reason || '').slice(0, 300),
      status: 'Pending',
    });

    const populated = await Swap.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('createSwap error:', err);
    // Surface validation details to help you debug in dev
    const detail = err?.message || String(err);
    return res.status(500).json({ message: 'Failed to create swap request.', detail });
  }
};

/**
 * PATCH /api/swaps/:id/approve  (admin)
 * If the target shift is unassigned, move requester there and unassign the source.
 * Else, swap assignees.
 */
const approveSwap = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    const swap = await Swap.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending swaps can be approved' });
    }

    const [fromShift, toShift] = await Promise.all([
      Shift.findById(swap.fromShiftId),
      Shift.findById(swap.toShiftId),
    ]);
    if (!fromShift || !toShift) return res.status(404).json({ message: 'Shift(s) not found' });

    if (!toShift.userId) {
      // target is unassigned: move requester there, unassign from source
      toShift.userId = fromShift.userId || null;
      fromShift.userId = null;
    } else {
      // both assigned: swap assignees
      const tmp = fromShift.userId;
      fromShift.userId = toShift.userId;
      toShift.userId   = tmp;
    }

    await Promise.all([fromShift.save(), toShift.save()]);
    swap.status = 'Approved';
    await swap.save();

    const populated = await Swap.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } });

    res.json(populated);
  } catch (err) {
    console.error('approveSwap error:', err);
    res.status(500).json({ message: 'Failed to approve swap.', detail: err?.message || String(err) });
  }
};

/**
 * PATCH /api/swaps/:id/reject  (admin)
 */
const rejectSwap = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    const swap = await Swap.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending swaps can be rejected' });
    }

    swap.status = 'Rejected';
    await swap.save();

    const populated = await Swap.findById(swap._id)
      .populate('requester', 'name email')
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } });

    res.json(populated);
  } catch (err) {
    console.error('rejectSwap error:', err);
    res.status(500).json({ message: 'Failed to reject swap.', detail: err?.message || String(err) });
  }
};

/**
 * DELETE /api/swaps/:id  (requester or admin)
 */
const cancelSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const swap = await Swap.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = String(swap.requester) === String(req.user.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to cancel this swap' });
    }
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending swaps can be cancelled' });
    }

    await swap.deleteOne();
    res.json({ message: 'Swap request cancelled' });
  } catch (err) {
    console.error('cancelSwap error:', err);
    res.status(500).json({ message: 'Failed to cancel swap request.', detail: err?.message || String(err) });
  }
};

module.exports = {
  listSwaps,
  createSwap,
  approveSwap,
  rejectSwap,
  cancelSwap,
};
