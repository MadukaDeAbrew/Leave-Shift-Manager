// services/LeaveService.js
const Shift = require("../models/Shift");
const Leave = require("../models/Leave");

class RequestStrategy {
  async approve(leave) {
    await this._approveLeave(leave);
    await this.handleSpecifics(leave);
    return leave;
  }

  async _approveLeave(leave){
  leave.status = 'Approved';
    await leave.save();

    // deleted the overlap shift
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const startDateStr = leaveStart.toISOString().split('T')[0];
    const endDateStr = leaveEnd.toISOString().split('T')[0];

    const overlappingShifts = await Shift.find({
      userId: leave.userId,
      shiftDate: { $gte: startDateStr, $lte: endDateStr }
    });

    const toDelete = overlappingShifts.filter(shift => {
      const shiftStart = new Date(`${shift.shiftDate}T${shift.startTime}:00`);
      const shiftEnd = new Date(`${shift.shiftDate}T${shift.endTime}:00`);
      return shiftStart < leaveEnd && shiftEnd > leaveStart;
    });

    if (toDelete.length > 0) {
      await Shift.deleteMany({ _id: { $in: toDelete.map(s => s._id) } });
    }

    return leave;
  }
  async handleSpecifics(leave) {
    throw new Error("handleSpecifics() must be implemented");
  }
}

class LeaveApproveStrategy extends RequestStrategy {
  async handleSpecifics(leave) {
    console.log(`Approved leave for ${leave.userId}`);
  }
}

class SwapApproveStrategy extends RequestStrategy {

    // Swap process logic
    // Re-assign shift to this user.
    // The new shift is assigned by manager, which the manager can decided based on the user's shift preference.
    constructor(newShiftId) {
    super();
    this.newShiftId = newShiftId;
    }

  async handleSpecifics(leave) {
    if (!this.newShiftId) {
      throw new Error("No new shift ID provided for swap");
    }

    await shiftAssignTo(leave.userId, this.newShiftId);

    console.log(`Swap assigned via shiftAssignTo: shift ${this.newShiftId} to user ${leave.userId}`);
    return leave;
  };
}

module.exports = { LeaveApproveStrategy, SwapApproveStrategy };


class RequestService {
  static async rejectRequest(id) {
    const leave = await Leave.findById(id);
    if (!leave) throw new Error("Leave not found");

    leave.status = "Rejected";
    return await leave.save();
  }

  static async approveRequest(id) {
    const leave = await Leave.findById(id);
    if (!leave) throw new Error("Leave not found");

    // select strategy based on isAcceptSwap.
    const strategy = leave.isAcceptSwap ? new SwapApproveStrategy() : new LeaveApproveStrategy();
    return strategy.approve(leave);
  }

  /*static async approveRequest(id) {
    const leave = await Leave.findById(id);
    if (!leave) throw new Error("Leave not found");

    leave.status = 'Approved';
    const updated = await leave.save();

    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const startDateStr = leaveStart.toISOString().split('T')[0];
    const endDateStr = leaveEnd.toISOString().split('T')[0];

    const overlappingShifts = await Shift.find({
      userId: leave.userId,
      shiftDate: { $gte: startDateStr, $lte: endDateStr }
    });

    const toDelete = overlappingShifts.filter(shift => {
      const shiftStart = new Date(`${shift.shiftDate}T${shift.startTime}:00`);
      const shiftEnd = new Date(`${shift.shiftDate}T${shift.endTime}:00`);
      return shiftStart < leaveEnd && shiftEnd > leaveStart;
    });

    if (toDelete.length > 0) {
      await Shift.deleteMany({ _id: { $in: toDelete.map(s => s._id) } });
    }

    return updated;
  }*/
}

module.exports = RequestService;
