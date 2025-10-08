const ShiftService = require('../shiftServer');
const {SingleUser, UserGroup} = require('../shiftServer');


//get shift table and all user can access, all or self depend on scope.

exports.getShifts = async (req, res) => {
  try {
    const { from, to, scope:scopeRaw = 'self', status, jobRole } = req.query;
  
    //const { from, to, scope :scopeRaw='self' } = req.query;
    
    
    console.log({ from, to, scopeRaw, status, jobRole });

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    let requestedScope = Array.isArray(scopeRaw) ? scopeRaw[0] : scopeRaw;
    requestedScope = (requestedScope && requestedScope.trim()) ? requestedScope.trim().toLowerCase() : 'self';

    if (requestedScope === 'all' && req.user.systemRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Adimn only' });
    }
console.log({ from, to, requestedScope, status, jobRole });

    const shifts = await ShiftService.list({
      from,
      to,
      scope:requestedScope,
      viewerId: req.user.id,
      status,
      jobRole,

    });

  //console.log("shifts:",shifts)
  console.log('shifts length:', Array.isArray(shifts) ? shifts.length : 'N/A');
  return res.json(shifts);
  } catch (err) {
    console.error('[getShifts] error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//Get/api/shifts/unassigned (only manager)
exports.getUnassigned = async (req, res) => {
  try {
    if (req.user.systemRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin only' });
    }

    const { from, to } = req.query;
    const rows = await ShiftService.listUnassigned({ from, to });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Post/api/shifts
exports.addShift = async (req, res) => {
  try {
    if (req.user.systemRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { shiftDate, slotKey, jobRole, title } = req.body;
    if (!shiftDate || !slotKey) {
      return res.status(400).json({ message: 'date & slotKey are required' });
    }

    const doc = await ShiftService.create({
      shiftDate,
      slotKey,
      jobRole,
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
    if (req.user.systemRole !== 'admin') {
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
    if (req.user.systemRole !== 'admin') {
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
   
    if (req.user.systemRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { id } = req.params;
    const { userIds = [] } = req.body;
    console.log('[assignShift] id=', id, 'userIds=', userIds);  // 👈 打印真实入参
    /*et assignTo;
    if (userIds.length === 1){
      assignTo = new SingleUser(userIds[0]);
    }
    else{
      assignTo = new UserGroup(userIds.map(uid => new SingleUser(uid)));
    }*/
    const doc = await ShiftService.assign(id, userIds);
    res.json(doc);
  } catch (err) {
    console.error('[assignShift] ERROR before service:', err); // 👈 看这里有没有打印
    res.status(400).json({ message: err.message || 'Assign failed' });
  }
};
