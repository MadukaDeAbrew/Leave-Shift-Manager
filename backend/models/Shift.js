const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  role: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
