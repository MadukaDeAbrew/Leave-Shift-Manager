// backend/models/Leave.js
const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    leaveType: {
      type: String,
      enum: ['Annual', 'Sick', 'Casual', 'Unpaid', 'Study', 'Other'],
      default: 'Annual',
      required: true,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    isAcceptSwap:{type:Boolean,required:true, default: false},
    preference1:{type:String},
    preference2:{type:String},
    preference3:{type:String}
  },
  { timestamps: true }
);

// guard against bad ranges (basic)
LeaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('startDate must be on or before endDate'));
  }
  next();
});

module.exports = mongoose.model('Leave', LeaveSchema);
