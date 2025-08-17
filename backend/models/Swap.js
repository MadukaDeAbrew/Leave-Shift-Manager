// backend/models/Swap.js
const mongoose = require('mongoose');

const SwapSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  toShift:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  reason:    { type: String, default: '' },
  status:    { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Swap', SwapSchema);
