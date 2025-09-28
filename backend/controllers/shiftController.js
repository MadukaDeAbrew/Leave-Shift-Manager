const ShiftService = require('../shiftserver');


//get shift table and all user can access, all or self depend on scope.

exports.getShifts = async (req, res) => {
  try {
    const { from, to, scope = 'me', userId, status, roleInWork } = req.query;
    if (scope === 'all' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied: Manager only' });
    }
    const shifts = await ShiftService.list({
      from,
      to,
      scope,
      viewerId: req.user.id,
      userId,
      status,
      roleInWork,
    });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//check unassigned (only manager)
exports.getUnassigned = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin only' });
    }

    const { from, to } = req.query;
    const rows = await ShiftService.listUnassigned({ from, to });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// create shifts
exports.addShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { date, slotKey, roleInWork, title } = req.body;
    if (!date || !slotKey) {
      return res.status(400).json({ message: 'date & slotKey are required' });
    }

    const doc = await ShiftService.create({
      date,
      slotKey,
      roleInWork,
      title,
      createdBy: req.user.id,
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Create failed' });
  }
};

//update shift
exports.updateShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { id } = req.params;
    const patch = req.body;
    const doc = await ShiftService.update(id, patch);
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Update failed' });
  }
};

//delete shift
exports.deleteShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { id } = req.params;
    const r = await ShiftService.remove(id);
    res.json(r);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Delete failed' });
  }
};

//assign shifts
exports.assignShift = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { id } = req.params;
    const { userIds = [] } = req.body;
    const doc = await ShiftService.assign(id, userIds);
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Assign failed' });
  }
};
