// backend/models/Shift.js
const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema(
  {
    // OPTIONAL assignee (null means "unassigned")
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    shiftDate: { type: Date, required: true },            // day of the shift (00:00 time)
    startTime: { type: String, required: true },          // "HH:MM" 24h
    endTime:   { type: String, required: true },          // "HH:MM" 24h
    role:      { type: String, default: '' },

    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', ShiftSchema);
