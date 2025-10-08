//shift time constant//Encapsulation, userfor select shift time and calender
//exports.SLOTS = [
    //{key: 'morning', label: 'Morning'},
    //{ key: 'afternoon', label: 'Afternoon'},
//];

const SLOT_MAP = new Map([
  ['s08_10', { start: '08:00', end: '10:00' }],
  ['s10_12', { start: '10:00', end: '12:00' }],
  ['s12_14', { start: '12:00', end: '14:00' }],
  ['s14_16', { start: '14:00', end: '16:00' }],
  ['s16_18', { start: '16:00', end: '18:00' }],
  ['s18_20', { start: '18:00', end: '20:00' }],
]);

const norm = k => String(k ?? '').trim();

export function getSlotByKey(key) {
  return SLOT_MAP.get(norm(key)) || null;
}
export function isValidSlot(key) {
  return SLOT_MAP.has(norm(key));
}
//exports.getSlotByKey = (key) => SLOT_MAP.get(key) || null
//exports.isValidSlot = (key) => SLOT_MAP.has(key);
//vaild shift the time ture  or false
//exports.byKey = SLOT_MAP;


//exchange date to weekday
//exports.weekdayKey = (yyy_mm_dd) =>
    //thinking change *
  //['sun','mon','tue','wed','thu','fri','sat'][new Date(yyyy_mm_dd + 'T00:00:00').getDay()];