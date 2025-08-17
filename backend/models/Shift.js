const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shiftDate: { type: Date, required: true },          // <-- was `date`
    startTime: { type: String, required: true },         // "HH:MM"
    endTime: { type: String, required: true },           // "HH:MM"
    role: { type: String, default: '' },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', ShiftSchema);
