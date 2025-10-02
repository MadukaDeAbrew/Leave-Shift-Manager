//shift time constant//Encapsulation, userfor select shift time and calender
exports.SLOTS = [
    {key: 'morning', label: 'Morning'},
    { key: 'afternoon', label: 'Afternoon'},
];

//vaild shift the time ture  or false
exports.byKey = new Map(exports.SLOTS.map(s => [s.key, s]));


//exchange date to weekday
exports.weekdayKey = (yyy_mm_dd) =>
    //thinking change *
  ['sun','mon','tue','wed','thu','fri','sat'][new Date(yyyy_mm_dd + 'T00:00:00').getDay()];