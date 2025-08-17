// backend/models/SwapRequest.js
const mongoose = require('mongoose');

const SwapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    toShift:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    reason:    { type: String, maxlength: 300, default: '' },
    status:    { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SwapRequest', SwapRequestSchema);
