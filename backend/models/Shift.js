// backend/models/Shift.js
const mongoose = require('mongoose');
//const Schema = mongoose.Schema;
//const {Schema, Type} = mongoose;       //destructure S,Y from mogo

const ShiftSchema = new mongoose.Schema(
  {
    // OPTIONAL assignee (null means "unassigned")
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    shiftDate: { type: Date, required: true },            // day of the shift (00:00 time)
    startTime: { type: String, required: true },          // "HH:MM" 24h
    endTime:   { type: String, required: true },          // "HH:MM" 24h
    role:      { type: String, default: '' },

    assignedTo: [mongoose.Schema.Types.ObjectId],

  //  status: {
   //   type: String,
   //   enum: ['Scheduled', 'Completed', 'Cancelled'],
  //    default: 'Scheduled',
  //  },

    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
   // createdBy: {type:Types.ObecttId,ref: 'User'},
 },
  { timestamps: true },
);
ShiftSchema.index({date:1, startTime:1});                                        //order date and time
module.exports = mongoose.model('Shift', ShiftSchema);



//preference//
//const mongoose = require('mongoose');

const timeRangeSchema = new mongoose.Schema({
  start: { type: String, required: true, match: /^\d{2}:\d{2}$/ },         
  end:   { type: String, required: true, match: /^\d{2}:\d{2}$/ },
},
  { _id: false }
);

const preferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true },
    weekdays: {
      mon: { type: [timeRangeSchema], default: [] },
      tue: { type: [timeRangeSchema], default: [] },
      wed: { type: [timeRangeSchema], default: [] },
      thu: { type: [timeRangeSchema], default: [] },
      fri: { type: [timeRangeSchema], default: [] },
      sat: { type: [timeRangeSchema], default: [] },
      sun: { type: [timeRangeSchema], default: [] },
    },
     validFrom: Date,
     validTo:   Date,  
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', ShiftSchema);
