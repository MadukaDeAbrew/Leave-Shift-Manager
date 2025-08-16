// backend/controllers/leaveController.js
const Leave = require('../models/Leave');

/**
 * GET /api/leaves
 * - Admin: all leaves (optionally populate)
 * - User: own leaves
 */
const getLeaves = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { userId: req.user.id };

    // If you want admin UI to show names, keep populate; users don’t need it
    const q = Leave.find(filter).sort({ startDate: -1 });
    if (isAdmin) q.populate('userId', 'name email');

    const leaves = await q.exec();
    res.json(leaves);
  } catch (err) {
    console.error('getLeaves error:', err);
    res.status(500).json({ message: 'Failed to load leaves.' });
  }
};

/**
 * POST /api/leaves
 * - Authenticated user creates a leave request
 * Body: { startDate, endDate, leaveType, reason }
 */
const createLeave = async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required.' });
    }

    const leave = await Leave.create({
      userId: req.user.id,
      startDate,
      endDate,
      leaveType: leaveType || 'Annual',
      reason: (reason || '').trim(),
      status: 'Pending',
    });

    res.status(201).json(leave);
  } catch (err) {
    console.error('createLeave error:', err);
    // handle schema range error
    if (err.message && /startDate must be on or before endDate/.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to create leave.' });
  }
};

//PUT /api/leaves/:id

// Owner can edit only while Pending; Admin can edit anytime
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found! Check detail again!' });

    const isOwner = leave.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this leave' });
    }

    // Users can only edit while Pending
    if (isOwner && !isAdmin && leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending leaves can be updated by the requester' });
    }

    const { startDate, endDate, leaveType, reason, status } = req.body;

    // Allow requester to change their own fields; status is admin-only
    if (startDate !== undefined) leave.startDate = startDate;
    if (endDate !== undefined) leave.endDate = endDate;
    if (leaveType !== undefined) leave.leaveType = leaveType;
    if (reason !== undefined) leave.reason = (reason || '').trim();

    // Admin can update status (and optionally other fields as above)
    if (status !== undefined && isAdmin) leave.status = status;

    // Basic range validation already handled by schema pre-save
    const updated = await leave.save();
    return res.json(updated);
  } catch (err) {
    console.error('updateLeave error:', err);
    return res.status(500).json({ message: 'Failed to update leave.' });
  }
};

/**
 * DELETE /api/leaves/:id
 * - User can delete till pending status
 */
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    const isOwner = leave.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Rule: user can only delete if Pending, otherwise block
    if (isOwner) {
      if (leave.status !== 'Pending') {
        return res.status(403).json({ message: 'Cannot delete leave once it is processed' });
      }
    } else if (!isAdmin) {
      // not owner, not admin → forbidden
      return res.status(403).json({ message: 'Not authorized to delete this leave' });
    }

    await leave.deleteOne();
    res.json({ message: 'Leave deleted' });
  } catch (err) {
    console.error('deleteLeave error:', err);
    res.status(500).json({ message: 'Failed to delete leave.' });
  }
};



 //For Admin approvals

const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    leave.status = 'Approved';
    res.json(await leave.save());
  } catch (err) {
    console.error('approveLeave error:', err);
    res.status(500).json({ message: 'Failed to approve leave.' });
  }
};

const rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    leave.status = 'Rejected';
    res.json(await leave.save());
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
