// backend/models/Shift.js
const mongoose = require('mongoose');
//const Schema = mongoose.Schema;
//const {Schema, Type} = mongoose;       //destructure S,Y from mogo

const ShiftSchema = new mongoose.Schema(
  {
    // OPTIONAL assignee (null means "unassigned")
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    shiftDate: { type: String, required: true },
    weekDay: {type: String},            // day of the shift ,raise weekday automatically
    startTime: { type: String, required: true },          // "HH:MM" 24h
    endTime:   { type: String, required: true },          // "HH:MM" 24h
    jobRole:      { type: String, default: '' },

    assignedTo: [mongoose.Schema.Types.ObjectId],

  //  status: {
   //   type: String,
   //   enum: ['Scheduled', 'Completed', 'Cancelled'],
  //    default: 'Scheduled',
  //  },

    status: {
      type: String,
      enum: ['unassigned', 'assigned'],
      default: 'unassigned'
    },
   // createdBy: {type:Types.ObecttId,ref: 'User'},
 },
  { timestamps: true },
);
ShiftSchema.index({shiftDate:1, startTime:1});                                        //order date and time
module.exports = mongoose.model('Shift', ShiftSchema);

