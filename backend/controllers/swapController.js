// backend/controllers/swapController.js
const SwapRequest = require('../models/SwapRequest');
const Shift = require('../models/Shift');

/** GET /api/swaps (admin: all, user: own) */
async function listSwaps(req, res) {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { requester: req.user.id };

    const swaps = await SwapRequest.find(filter)
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } })
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch (err) {
    console.error('listSwaps error:', err);
    res.status(500).json({ message: 'Failed to load swap requests.' });
  }
}

/** POST /api/swaps  Body: { fromShiftId, toShiftId, reason? } */
async function createSwap(req, res) {
  try {
    const { fromShiftId, toShiftId, reason } = req.body || {};
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
    if (!fromShift || !toShift) {
      return res.status(404).json({ message: 'One or both shifts not found' });
    }

    // Optional guard: requester must own the fromShift if it’s assigned to a user
    if (fromShift.userId && String(fromShift.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only request swaps for your own shift' });
    }

    const swap = await SwapRequest.create({
      fromShiftId,
      toShiftId,
      requester: req.user.id,
      reason: reason || '',
      status: 'Pending',
    });

    const populated = await SwapRequest.findById(swap._id)
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } })
      .populate('requester', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    console.error('createSwap error:', err);
    res.status(500).json({ message: 'Failed to create swap request.' });
  }
}

/** PATCH /api/swaps/:id/approve  (admin) */
async function approveSwap(req, res) {
  try {
    const { id } = req.params;
    const swap = await SwapRequest.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const [fromShift, toShift] = await Promise.all([
      Shift.findById(swap.fromShiftId),
      Shift.findById(swap.toShiftId),
    ]);
    if (!fromShift || !toShift) {
      return res.status(404).json({ message: 'Associated shift not found' });
    }

    // Swap their assignees (null allowed = unassigned)
    const tempUser = fromShift.userId || null;
    fromShift.userId = toShift.userId || null;
    toShift.userId   = tempUser;

    await Promise.all([fromShift.save(), toShift.save()]);

    swap.status = 'Approved';
    await swap.save();

    const populated = await SwapRequest.findById(id)
      .populate({ path: 'fromShiftId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShiftId',   populate: { path: 'userId', select: 'name email' } })
      .populate('requester', 'name email');

    res.json(populated);
  } catch (err) {
    console.error('approveSwap error:', err);
    res.status(500).json({ message: 'Failed to approve swap.' });
  }
}

/** PATCH /api/swaps/:id/reject  (admin) */
async function rejectSwap(req, res) {
  try {
    const { id } = req.params;
    const swap = await SwapRequest.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    swap.status = 'Rejected';
    await swap.save();
    res.json(swap);
  } catch (err) {
    console.error('rejectSwap error:', err);
    res.status(500).json({ message: 'Failed to reject swap.' });
  }
}

module.exports = { listSwaps, createSwap, approveSwap, rejectSwap };
