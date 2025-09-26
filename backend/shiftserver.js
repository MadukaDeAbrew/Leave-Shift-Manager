const Shift = require('../models/Shift');                 
const { isValidSlot } = require('../constants/slots'); 

//ShfitService

class ShiftService {
  async list({from, to, scope, roleInwork, userId}){}
  async listUnassigned({from, to}){}
  async assign(shiftId, userIds){return ture}
}

module.exports = app

//ShiftService decorators
//manager
exports.withUassignFlag = (shifts) =>
  shifts.map(shift =>({
  ...shift.toObject?.() ?? shift, //...express methods in mongo. s.toObject?.() → undefined
  meta: { ...(shift.meta || {}), unassigned: shift.status === 'unassigned' },
}));

//User
exports.withPreferenceMatch = (shifts, preference) =>
  shifts.map(s => {
    const weekday = new Date(s.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short'}).slice(0,3).toLowerCase();
    const slot = toSlot(s.startTime, s.endTime); // morning/afternoon/evening/night
    const hit = !!pref?.weekdays?.[weekday]?.[slot];
    return { ...s.toObject?.() ?? s, meta: { ...(s.meta||{}), matchesPreference: hit } };
  });

