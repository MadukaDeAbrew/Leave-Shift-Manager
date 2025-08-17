// backend/models/SwapRequest.js
const mongoose = require('mongoose');

const SwapRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // The shift the requester wants to give up (must currently belong to requester)
    fromShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },

    // The shift the requester wants to take (may be unassigned or belong to someone else)
    toShiftId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },

    reason: { type: String, default: '' },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SwapRequest', SwapRequestSchema);
