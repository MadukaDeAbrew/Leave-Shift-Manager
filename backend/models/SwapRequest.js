// backend/models/SwapRequest.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SwapRequestSchema = new Schema(
  {
    fromShiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    toShiftId:   { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    requester:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason:      { type: String, default: '' },
    status:      { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SwapRequest', SwapRequestSchema);
