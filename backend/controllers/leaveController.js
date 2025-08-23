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

// backend/controllers/leaveController.js
const createLeave = async (req, res) => {
  try {
    // ✅ prefer authenticated user, but fall back to body.userId for tests
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { startDate, endDate, reason, leaveType } = req.body;
    if (!startDate) return res.status(400).json({ success: false, message: 'startDate is required' });
    if (!endDate)   return res.status(400).json({ success: false, message: 'endDate is required' });

    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date(s) provided' });
    }
    if (sd > ed) {
      return res.status(400).json({ success: false, message: 'startDate must be on or before endDate' });
    }

    const leave = await Leave.create({
      userId,                     // 👈 use the resolved userId
      startDate: sd,
      endDate: ed,
      reason: (reason || '').trim(),
      leaveType: leaveType || 'Annual',
      status: 'Pending',
    });

    return res.status(201).json({ success: true, leave });  // 👈 success: true
  } catch (err) {
    console.error('createLeave error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create leave.' });
  }
};



/**
 * PUT /api/leaves/:id
 * - Owner or Admin can update details
 * - Optional: Only Pending can be edited by non-admin (uncomment to enforce)
 */
// PUT /api/leaves/:id
// - Owner or Admin can update details
// - Non-admins may be limited to editing only Pending leaves (toggle via flag)
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

    // (optional) block non-admin from editing non-Pending
    const ONLY_PENDING_FOR_USERS = true;
    if (ONLY_PENDING_FOR_USERS && !isAdmin && leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending leaves can be updated by the requester' });
    }

    // Extract potential updates
    const { startDate, endDate, reason, leaveType, status } = req.body;

    // ---- VALIDATION: updated date ranges ----
    // Only validate dates if either date is present in the payload.
    let sd = leave.startDate;
    let ed = leave.endDate;

    if (startDate !== undefined) {
      const parsed = new Date(startDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid startDate' });
      }
      sd = parsed;
    }

    if (endDate !== undefined) {
      const parsed = new Date(endDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid endDate' });
      }
      ed = parsed;
    }

    // If any date was provided, enforce start <= end
    if ((startDate !== undefined || endDate !== undefined) && sd > ed) {
      return res.status(400).json({ message: 'startDate must be on or before endDate' });
    }

    // (optional) disallow past start dates for non-admin edits
    const allowPast = false; // set true if you WANT to allow editing into the past
    if (!allowPast && !isAdmin && (startDate !== undefined)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (sd < today) {
        return res.status(400).json({ message: 'startDate cannot be in the past' });
      }
    }

    // Apply updates
    if (startDate !== undefined) leave.startDate = sd;
    if (endDate !== undefined)   leave.endDate = ed;
    if (reason !== undefined)    leave.reason = (reason || '').toString().slice(0, 500);
    if (leaveType !== undefined) leave.leaveType = leaveType;

    // Status change: admin only
    if (status !== undefined && isAdmin) {
      if (!['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      leave.status = status;
    }

    const updated = await leave.save();
    return res.json(updated);
  } catch (err) {
    console.error('updateLeave error:', err);
    return res.status(500).json({ message: 'Failed to update leave.' });
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

// PATCH /api/leaves/:id/status  (Admin)
// Body: { status: 'Approved' | 'Rejected', note?: string }
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // only these statuses may be set via this endpoint
    const ALLOWED = new Set(['Approved', 'Rejected']);
    if (!ALLOWED.has(status)) {
      return res.status(400).json({ message: 'Invalid status. Use Approved or Rejected.' });
    }

    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // Optional: block changing already-finalized decisions
    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending leaves can be decided.' });
    }

    leave.status = status;
    leave.decidedBy = req.user.id;   // admin making the decision
    leave.decidedAt = new Date();
    if (typeof note === 'string') leave.decisionNote = note.trim();

    const saved = await leave.save();
    return res.json(saved);
  } catch (err) {
    console.error('updateLeaveStatus error:', err);
    return res.status(500).json({ message: 'Failed to update leave status.' });
  }
};

module.exports = {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  updateLeaveStatus,
 rejectLeave,
  
};
