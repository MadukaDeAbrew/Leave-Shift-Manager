//shift time constant//Encapsulation, userfor select shift time and calender
exports.SLOTS = [
    {key: 's08_10', start: '08:00', end: '10:00', label: '8:00am-10:00am'},
    { key: 's10_12', start: '10:00', end: '12:00', label: '10:00am-12:00pm'},
    { key: 's12_14', start: '12:00', end: '14:00', label: '12:00pm-2:00pm' },
    { key: 's14_16', start: '14:00', end: '16:00', label: '2:00pm-4:00pm' },
    { key: 's16_18', start: '16:00', end: '18:00', label: '4:00pm-6:00pm' },
    { key: 's18_20', start: '18:00', end: '20:00', label: '6:00pm-8:00pm' },
];

//vaild shift the time ture ture or false
exports.isValidSlot = (start, end) => {
    for (const s of exports.SLOTS){
        if (s.start === start && s.end === end){
            return true;
        }
    }
    return false;
 };

//exchange dare to weekday
exports.weekdayKey = (yyy_mm_dd) =>
    //thinking change *
  ['sun','mon','tue','wed','thu','fri','sat'][new Date(yyyy_mm_dd + 'T00:00:00').getDay()];