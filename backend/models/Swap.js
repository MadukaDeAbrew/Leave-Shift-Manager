// backend/models/Swap.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SwapSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    fromShiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    toShiftId:   { type: Schema.Types.ObjectId, ref: 'Shift', required: true },

    reason: { type: String, default: '' },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Swap', SwapSchema);
