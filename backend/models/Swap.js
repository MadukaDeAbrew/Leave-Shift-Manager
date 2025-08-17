// backend/models/Swap.js
const mongoose = require('mongoose');

const SwapSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true }, // requester's shift
    targetShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true }, // other user's shift
    message:     { type: String, default: '' },
    status:      { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Swap', SwapSchema);
