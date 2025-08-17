// backend/controllers/swapController.js
const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const Swap = require('../models/Swap'); // create schema if you don't have it yet
const User = require('../models/User');

/*
Swap schema (example):
- requester: ObjectId (User)  // who asked
- fromShift: ObjectId (Shift) // their shift
- toShift:   ObjectId (Shift) // target shift
- reason: String
- status: 'Pending' | 'Approved' | 'Declined' | 'Cancelled'
- createdAt/updatedAt
*/

const createSwap = async (req, res) => {
  try {
    const { fromShiftId, toShiftId, reason } = req.body;
    if (!fromShiftId || !toShiftId) {
      return res.status(400).json({ message: 'fromShiftId and toShiftId are required' });
    }

    const from = await Shift.findById(fromShiftId).populate('userId', 'name email');
    const to   = await Shift.findById(toShiftId).populate('userId', 'name email');

    if (!from || !to) return res.status(404).json({ message: 'Shift not found' });

    // Must own the from shift
    if (String(from.userId?._id || from.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only request swaps for your own shift' });
    }

    // (Optional) same day constraint
    if (String(new Date(from.shiftDate).setHours(0,0,0,0)) !== String(new Date(to.shiftDate).setHours(0,0,0,0))) {
      return res.status(400).json({ message: 'Swap must be for the same day' });
    }

    const swap = await Swap.create({
      requester: req.user.id,
      fromShift: from._id,
      toShift: to._id,
      reason: reason || '',
      status: 'Pending',
    });

    res.status(201).json(
      await Swap.findById(swap._id)
        .populate('requester', 'name email')
        .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
        .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } })
    );
  } catch (err) {
    console.error('createSwap error:', err);
    res.status(500).json({ message: 'Server error creating swap', detail: err?.message || String(err) });
  }
};

const listMine = async (req, res) => {
  try {
    const list = await Swap.find({ requester: req.user.id })
      .sort({ createdAt: -1 })
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } });
    res.json(list);
  } catch (err) {
    console.error('listMine error:', err);
    res.status(500).json({ message: 'Failed to load my swap requests' });
  }
};

const listAll = async (req, res) => {
  try {
    const list = await Swap.find()
      .sort({ createdAt: -1 })
      .populate('requester', 'name email')
      .populate({ path: 'fromShift', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'toShift',   populate: { path: 'userId', select: 'name email' } });
    res.json(list);
  } catch (err) {
    console.error('listAll error:', err);
    res.status(500).json({ message: 'Failed to load swap requests' });
  }
};

const cancelMine = async (req, res) => {
  try {
    const { id } = req.params;
    const swap = await Swap.findById(id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (String(swap.requester) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not your request' });
    }
    if (swap.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }
    await swap.deleteOne();
    res.json({ message: 'Swap request cancelled' });
  } catch (err) {
    console.error('cancelMine error:', err);
    res.status(500).json({ message: 'Failed to cancel swap' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' | 'Declined'
    const swap = await Swap.findById(id)
      .populate('fromShift')
      .populate('toShift');
    if (!swap) return res.status(404).json({ message: 'Swap not found' });

    if (!['Approved', 'Declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // apply if approved — swap assignees
    if (status === 'Approved') {
      const from = swap.fromShift;
      const to   = swap.toShift;
      const a = from.userId || null;
      const b = to.userId || null;
      from.userId = b;
      to.userId   = a;
      await from.save();
      await to.save();
    }

    swap.status = status;
    await swap.save();

    res.json({ message: `Swap ${status.toLowerCase()}`, swap });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ message: 'Failed to update swap status' });
  }
};

module.exports = { createSwap, listMine, listAll, cancelMine, updateStatus };
