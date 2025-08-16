// backend/controllers/leaveController.js
const Leave = require('../models/Leave');

/**
 * GET /api/leaves
 * - Admin: all leaves (populated user)
 * - User: own leaves
 * Query params: page, limit, status
 */
const getLeaves = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';

    // pagination params
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    // base filter: admin sees all, user sees own
    const filter = isAdmin ? {} : { userId: req.user.id };

    // optional status filter (exact match: Pending/Approved/Rejected/Cancelled)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // query
    const q = Leave.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit);
    if (isAdmin) q.populate('userId', 'name email');

    const [leaves, total] = await Promise.all([
      q.exec(),
      Leave.countDocuments(filter),
    ]);

    res.json({
      leaves,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
      limit,
    });
  } catch (err) {
    console.error('getLeaves error:', err);
    res.status(500).json({ message: 'Failed to load leaves.' });
  }
};

/**
 * POST /api/leaves
 * - User creates a leave request
 * Body: { startDate, endDate, reason?, leaveType? }
 */
const createLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;

    if (!startDate) return res.status(400).json({ message: 'startDate is required' });
    if (!endDate)   return res.status(400).json({ message: 'endDate is required' });

    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
      return res.status(400).json({ message: 'Invalid date(s) provided' });
    }
    if (sd > ed) {
      return res.status(400).json({ message: 'startDate must be on or before endDate' });
    }

    const leave = await Leave.create({
      userId: req.user.id,
      startDate: sd,
      endDate: ed,
      reason: (reason || '').trim(),
      leaveType: leaveType || 'Annual',
      status: 'Pending',
    });

    res.status(201).json(leave);
  } catch (err) {
    console.error('createLeave error:', err);
    res.status(500).json({ message: 'Failed to create leave.' });
  }
};

/**
 * PUT /api/leaves/:id
 * - Owner or Admin can update details
 * - Optional: Only Pending can be edited by non-admin (uncomment to enforce)
 */
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    const isOwner = leave.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this leave' });
    }

    const { startDate, endDate, reason, leaveType, status } = req.body;

    //  block edits on non-Pending leaves for users:
    if (!isAdmin && leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending leaves can be updated by user' });
    }

    if (startDate !== undefined) leave.startDate = startDate;
    if (endDate !== undefined)   leave.endDate   = endDate;
    if (reason !== undefined)    leave.reason    = reason;
    if (leaveType !== undefined) leave.leaveType = leaveType;
    if (status !== undefined && isAdmin) leave.status = status; // only admin can change status

    const updated = await leave.save();
    res.json(updated);
  } catch (err) {
    console.error('updateLeave error:', err);
    res.status(500).json({ message: 'Failed to update leave.' });
  }
};

/**
 * DELETE /api/leaves/:id
 * - Owner can delete only when Pending
 * - Admin can delete always
 */
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    const isOwner = leave.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (leave.status !== 'Pending') {
        return res.status(403).json({ message: 'Only Pending leaves can be deleted by user' });
      }
    }

    await leave.deleteOne();
    res.json({ message: 'Leave deleted' });
  } catch (err) {
    console.error('deleteLeave error:', err);
    res.status(500).json({ message: 'Failed to delete leave.' });
  }
};

/**
 * PATCH /api/leaves/:id/approve  (Admin)
 * Sets status to "Approved"
 */
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = 'Approved';
    const updated = await leave.save();
    res.json(updated);
  } catch (err) {
    console.error('approveLeave error:', err);
    res.status(500).json({ message: 'Failed to approve leave.' });
  }
};

/**
 * PATCH /api/leaves/:id/reject  (Admin)
 * Sets status to "Rejected"
 */
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = 'Rejected';
    const updated = await leave.save();
    res.json(updated);
  } catch (err) {
    console.error('rejectLeave error:', err);
    res.status(500).json({ message: 'Failed to reject leave.' });
  }
};

module.exports = {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
};
