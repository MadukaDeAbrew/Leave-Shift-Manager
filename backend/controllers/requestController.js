// backend/controllers/leaveController.js
const Leave = require('../models/Leave');
const Shift = require('../models/Shift');

/**
 * GET /api/request
 * - Admin: all leaves (populated user)
 * Query params: page, limit, status
 */
const getLeaves = async (req, res) => {
  try {
    const isAdmin = req.user?.systemRole === 'admin';
    //const isAdmin = true
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

/**
 * PUT /api/leaves/:id
 * - Owner or Admin can update details
 * - Optional: Only Pending can be edited by non-admin (uncomment to enforce)
 */
// PUT /api/leaves/:id
// - Owner or Admin can update details
// - Non-admins may be limited to editing only Pending leaves (toggle via flag)

/**
 * PATCH /api/leaves/:id/approve  (Admin)
 * Sets status to "Approved"
 */
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = 'Approved';
    const updated = await leave.save();

    // delete all the shift between the leave time.
    // only can be use after modify shift time information format
    /*await Shift.deleteMany(
      {
        userId:leave.userId,
        date:{$gte:leave.startDate, $lte:leave.endDate}
      }
    )*/

    const leaveStart = new Date(leave.startDate); // leave start
    const leaveEnd   = new Date(leave.endDate);   // leave end
    const startDateStr = leaveStart.toISOString().split('T')[0]; //'YYYY-MM-DD'
    const endDateStr = leaveEnd.toISOString().split('T')[0];

    const overlappingShifts = await Shift.find(
      {
        userId:leave.userId,
        shiftDate:{$gte: startDateStr, $lte:endDateStr}
      }
    );

    const toDelete = overlappingShifts.filter(shift =>{
      const shiftStart = new Date(`${shift.shiftDate}T${shift.startTime}:00`);
      const shiftEnd = new Date(`${shift.shiftDate}T${shift.endTime}:00`);

      return shiftStart< leaveEnd && shiftEnd>leaveStart;
    })

    if (toDelete.length>0){
      await Shift.deleteMany({_id:{$in:toDelete.map(s => s._id)}});
    }
    // delete overlap shift
    /*const shifts = await Shift.find({ userId: leave.userId });

    for (const shift of shifts) {
      const shiftStart = new Date(`${shift.shiftDate}T${shift.startTime}:00`);
      const shiftEnd   = new Date(`${shift.shiftDate}T${shift.endTime}:00`);

      // judge if the shift overlap
      if (shiftStart < leaveEnd && shiftEnd > leaveStart) {
        await Shift.deleteOne({ _id: shift._id });
      }
    }*/

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
const rejectRequest = async (req, res) => {
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
  approveRequest,
  updateLeaveStatus,
  rejectRequest,
  
};
