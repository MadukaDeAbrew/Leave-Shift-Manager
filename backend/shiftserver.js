const Shift = require('./models/Shift');                 
//const { isValidsolt,getSlotByKey } = require('./config/slot'); 
//const shiftRoutes = require('./routes/shiftRoutes');
const slots = require('./config/slot');


/*class AssigntoComponent{
  getUserIds(){
    throw new Error("getUserIds() must be implemented");
  }
}

class SingleUser extends AssigntoComponent{
  constructor(userId){
    super();this.userId=userId;
  }
  getUserIds(){
    return [this.userId];
  }
}

class UserGroup extends AssigntoComponent{
  constructor(users = []){super();this.users=users;}
  add(userComponent){this.users.push(userComponent);}
  getUserIds(){return this.users.flatMap(u=>u.getUserIds());}
}*/

//ShfitService

class ShiftService {
  async list({from, to, scope, viewerId, jobRole,status, slotKey}){
    const q = {};

     //console.log('[ShiftService.list] Query conditions:', q);
    if (from && to)q.shiftDate = {$gte:from, $lte:to}; //>= and <= date
    if (status) q.status = status;
    if (jobRole) q.jobRole = jobRole;
    if(slotKey) q.slotKey = slotKey;

    if (scope === 'self'&& viewerId){
        q.assignedTo = viewerId;
    }

   // return Shift.find(q).sort({ shiftDate: 1, startTime: 1 }).populate('assignedTo', 'name email');
   return Shift.find(q)
  .sort({ shiftDate: 1, startTime: 1 })
  .populate({ path: 'assignedTo', select: 'firstName jobRole email', model: 'User' });


}  

//unassigned
async listUnassigned({ from, to }) {
    const q = { status: 'unassigned' }; 
    if (from && to) q.shiftDate = { $gte: from, $lte: to }; 
    return Shift.find(q).sort({ shiftDate: 1, startTime: 1 });
}

//manager create new shifts
async create({ shiftDate, slotKey,jobRole, createdBy }) {
  //const slot = slots.byKey.get(slotKey);
  const slot =slots.getSlotByKey(slotKey); 
  console.log('slotKey =', slotKey, 'slot =', slot ?? '(not found)');
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

async assign(_id, pickedIds){
  console.log(
    '[ShiftService.assign] ENTER',
    '\n  _id                =', _id,
    '\n  typeof assignee    =', typeof pickedIds,
  );
  //all user incliuding manager and empolyee can update status
  const s = await Shift.findById(_id);
  if (!s) throw new Error('Shift not found');
   let userIds = [];
  /*const userIds = assigntoComponent.getUserIds();
  s.assignedTo = userIds;*/
  if (Array.isArray(pickedIds)) {
      userIds = pickedIds;
  } else if (pickedIds && typeof pickedIds.getUserIds === 'function') {
    userIds = pickedIds.getUserIds();
  } else {
    throw new Error('Invalid assignee argument');
  }
  if (!Array.isArray(userIds)) throw new Error('userIds must be an array');
  s.assignedTo = userIds;
  s.status = userIds.length === 0 
      ? 'unassigned'
      : 'assigned'; 

  await s.save({ validateBeforeSave: false });
  return Shift.findById(_id) 
  .populate({ path: 'assignedTo', select: 'firstName lastName name email', model: 'User' });
}
}

module.exports = new ShiftService();
module.exports.ShiftService = ShiftService;
//module.exports.SingleUser = SingleUser;
//module.exports.UserGroup  = UserGroup;




