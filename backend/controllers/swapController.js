// backend/controllers/swapController.js
const Swap = require('../models/Swap');
const Shift = require('../models/Shift');

/**
 * GET /api/swaps
 * - Admin: all swaps
 * - User: swaps they requested OR where their shift is the target (optional)
 * Query: role=allMine -> include both requested-by-me + requests-targeting-my-shifts
 */
const listSwaps = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const role = req.query.role || 'requested'; // requested | allMine

    let filter = {};
    if (!isAdmin) {
      if (role === 'allMine') {
        // swaps I requested OR where a shift of mine is target
        const myId = req.user.id;
        filter = { $or: [{ requesterId: myId }] };
        // Expand to include targetShift owned by me
        // We'll filter after populate for safety if needed.
      } else {
        filter = { requesterId: req.user.id };
      }
    }

    const swaps = await Swap.find(filter)
      .populate({ path: 'requesterId', select: 'name email' })
      .populate({ path: 'sourceShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'targetShift', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    // If role=allMine for non-admin: include where targetShift.userId == me
    let result = swaps;
    if (!isAdmin && role === 'allMine') {
      const me = String(req.user.id);
      result = swaps.filter(s =>
        String(s.requesterId?._id || s.requesterId) === me ||
        String(s.targetShift?.userId?._id || s.targetShift?.userId) === me
      );
    }

    res.json(result);
  } catch (err) {
    console.error('listSwaps error:', err);
    res.status(500).json({ message: 'Failed to load swaps.' });
  }
};

/**
 * POST /api/swaps
 * Body: { sourceShiftId, targetShiftId, message? }
 * - Only owner of sourceShift can request.
 * - Cannot request swap with own target shift.
 * - (Example rule) Must be same date to keep it simple.
 * - Creates Swap in Pending.
 */
const createSwap = async (req, res) => {
  try {
    const { sourceShiftId, targetShiftId, message } = req.body;
    if (!sourceShiftId || !targetShiftId) {
      return res.status(400).json({ message: 'sourceShiftId and targetShiftId are required' });
    }
    if (sourceShiftId === targetShiftId) {
      return res.status(400).json({ message: 'Cannot swap a shift with itself' });
    }

    const [source, target] = await Promise.all([
      Shift.findById(sourceShiftId),
      Shift.findById(targetShiftId),
    ]);

    if (!source || !target) return res.status(404).json({ message: 'Shift not found' });

    // Ownership: source must belong to requester
    if (String(source.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only request swaps for your own shift' });
    }

    // Disallow same owner
    if (String(target.userId) === String(req.user.id)) {
      return res.status(400).json({ message: 'Target shift cannot belong to you' });
    }

    // Simple rule: require same date (you can relax this)
    const srcDate = new Date(source.shiftDate); srcDate.setHours(0,0,0,0);
    const tgtDate = new Date(target.shiftDate); tgtDate.setHours(0,0,0,0);
    if (srcDate.getTime() !== tgtDate.getTime()) {
      return res.status(400).json({ message: 'Shifts must be on the same date for swap' });
    }

    // Optional: Avoid duplicate pending swap between the same pair
    const existing = await Swap.findOne({
      sourceShift: sourceShiftId,
      targetShift: targetShiftId,
      status: 'Pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'A pending swap request already exists for these shifts' });
    }

    const swap = await Swap.create({
      requesterId: req.user.id,
      sourceShift: sourceShiftId,
      targetShift: targetShiftId,
      message: message || '',
      status: 'Pending',
    });

    const populated = await Swap.findById(swap._id)
      .populate({ path: 'requesterId', select: 'name email' })
      .populate({ path: 'sourceShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'targetShift', populate: { path: 'userId', select: 'name email' } });

    res.status(201).json(populated);
  } catch (err) {
    console.error('createSwap error:', err);
    res.status(500).json({ message: 'Failed to create swap.' });
  }
};

/**
 * PATCH /api/swaps/:id/approve  (admin)
 * - Swaps userId on both shifts, marks swap Approved.
 */
const approveSwap = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { id } = req.params;
    const swap = await Swap.findById(id).populate('sourceShift').populate('targetShift');
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending swaps can be approved' });
    }

    const source = await Shift.findById(swap.sourceShift);
    const target = await Shift.findById(swap.targetShift);
    if (!source || !target) return res.status(404).json({ message: 'One or both shifts not found' });

    // Swap the assignees
    const tmp = source.userId;
    source.userId = target.userId;
    target.userId = tmp;

    await Promise.all([source.save(), target.save()]);

    swap.status = 'Approved';
    await swap.save();

    const populated = await Swap.findById(id)
      .populate({ path: 'requesterId', select: 'name email' })
      .populate({ path: 'sourceShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'targetShift', populate: { path: 'userId', select: 'name email' } });

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
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const { id } = req.params;
    const swap = await Swap.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending swaps can be rejected' });
    }
    swap.status = 'Rejected';
    const saved = await swap.save();
    res.json(saved);
  } catch (err) {
    console.error('rejectSwap error:', err);
    res.status(500).json({ message: 'Failed to reject swap.' });
  }
};

/**
 * DELETE /api/swaps/:id (requester cancels while Pending)
 */
const cancelSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const swap = await Swap.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (String(swap.requesterId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this swap' });
    }
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending swaps can be cancelled' });
    }
    swap.status = 'Cancelled';
    await swap.save();
    res.json({ message: 'Swap cancelled' });
  } catch (err) {
    console.error('cancelSwap error:', err);
    res.status(500).json({ message: 'Failed to cancel swap.' });
  }
};

module.exports = {
  listSwaps,
  createSwap,
  approveSwap,
  rejectSwap,
  cancelSwap,
};
