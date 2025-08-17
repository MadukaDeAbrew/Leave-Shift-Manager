/*// backend/models/SwapRequest.js
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

*/

const mongoose = require('mongoose');

const SwapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // shift the requester wants to swap out of
    fromShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    // a specific target shift or any compatible shift
    toShiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },

    // lifecycle status
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },

    // auditing
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SwapRequest', SwapRequestSchema);