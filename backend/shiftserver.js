const Shift = require('../models/Shift');                 
const { isValidSlot } = require('../constants/slots'); 

//ShfitService

class ShiftService {
  async list({from, to, scope, viewerId, userId,status}){
    const q = {};
    if (from && to)q.date = {$gte:from, $lte:to}; //>= and <= date
    if (status) q.status = status;

    if (scope === 'me'){
        q.assignedTo = viewerId;
    }
     else if (roleInWork) {                       // manager filter by roles
        q.roleInWork = roleInWork;       
  }
    return Shift.find(q).sort({ date: 1, startTime: 1 }); 
}  

//unassigned
async listUnassigned({ from, to }) {
    const q = { status: 'unassigned' }; 
    if (from && to) q.date = { $gte: from, $lte: to }; 
    return Shift.find(q).sort({ date: 1, startTime: 1 });
}

//manager create new shifts
async create({ date, slotKey,roleInWork, createdBy }) {
  const slot = slots.byKey.get(slotKey);
  if (!slot) throw new Error('no time valids');      
  const { start, end } = slot;                  
  return Shift.create({
    date, startTime: start, endTime: end, slotKey,
    roleInWork, createdBy, assignedTo: [], status: 'unassigned'
  });
}
}
//remove shifts
await Shift.findByIdAndDelete(id);
return { ok: true }; 

//all user incliuding manager and empolyee can update status
const s = await Shift.findById(id);
if (!s) throw new Error('Shift not found');

s.assignedTo = userIds;

s.status = userIds.length === 0 
    ? 'unassigned'
    : 'assigned'; 

await s.save();
return s;

module.exports = new ShiftService();




