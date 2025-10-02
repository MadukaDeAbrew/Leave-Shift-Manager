const Shift = require('./models/Shift');                 
const { isValidSlot } = require('./config/slot'); 
//const shiftRoutes = require('./routes/shiftRoutes');

//ShfitService

class ShiftService {
  async list({from, to, scope, viewerId, userId,status}){
    const q = {};
    if (from && to)q.shiftDate = {$gte:from, $lte:to}; //>= and <= date
    if (status) q.status = status;

    if (scope === 'me'){
        q.assignedTo = viewerId;
    }
     else if (scope === 'user' && userId) {                       
        q.assignedTo = userId;       
  }
    return Shift.find(q).sort({ shiftDate: 1, startTime: 1 }).populate('assignedTo', 'name email');

}  

//unassigned
async listUnassigned({ from, to }) {
    const q = { status: 'unassigned' }; 
    if (from && to) q.shiftDate = { $gte: from, $lte: to }; 
    return Shift.find(q).sort({ shiftDate: 1, startTime: 1 });
}

//manager create new shifts
async create({ shiftDate, slotKey,jobRole, createdBy }) {
  const slot = slots.byKey.get(slotKey);
  if (!slot) throw new Error('no time valids');      
  const { start, end } = slot;   

  return Shift.create({
    shiftDate, startTime: start, endTime: end, slotKey,
    jobRole, createdBy, assignedTo: [], status: 'unassigned'
  });
}

//remove shifts
async remove(_id){
  await Shift.findByIdAndDelete(_id);
  return { ok: true }; 
}


async assign(_id, userIds){
  //all user incliuding manager and empolyee can update status
  const s = await Shift.findById(_id);
  if (!s) throw new Error('Shift not found');

  s.assignedTo = userIds;

  s.status = userIds.length === 0 
      ? 'unassigned'
      : 'assigned'; 

  await s.save();
  return s;
}
}

module.exports = new ShiftService();




