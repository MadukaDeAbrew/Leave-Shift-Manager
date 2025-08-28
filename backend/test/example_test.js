// backend/test/example_test.js
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const Leave = require('../models/Leave');
const Shift = require('../models/Shift');

const leaveController = require('../controllers/leaveController');
const shiftController = require('../controllers/shiftController');

const { expect } = chai;

// Simple stubbed res object
function makeRes() {
  return {
    status: sinon.stub().returnsThis(),
    json: sinon.spy(),
  };
}

/* --------------------------- LEAVE TESTS --------------------------- */

describe('Leave Controller (minimal tests)', () => {
  afterEach(() => sinon.restore());

  it('createLeave → 201 and returns created leave', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: { id: userId },
      body: {
        startDate: '2025-12-30',
        endDate: '2025-12-31',
        leaveType: 'Annual',
        reason: 'Family Trip',
      },
    };
    const res = makeRes();

    const created = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      ...req.body,
      status: 'Pending',
    };

    const createStub = sinon.stub(Leave, 'create').resolves(created);

    await leaveController.createLeave(req, res);

    // Be tolerant about how controller builds the object (dates may become Date objects)
    expect(
      createStub.calledOnceWith(
        sinon.match
          .has('userId', userId)
          .and(sinon.match.has('startDate'))
          .and(sinon.match.has('endDate'))
          .and(sinon.match.has('leaveType', 'Annual'))
          .and(sinon.match.has('reason', 'Family Trip'))
      )
    ).to.be.true;

    expect(res.status.calledWith(201)).to.be.true;
    expect(
      res.json.calledWithMatch(
        sinon.match
          .has('userId', userId)
          .and(sinon.match.has('leaveType', 'Annual'))
          .and(sinon.match.has('reason', 'Family Trip'))
      )
    ).to.be.true;
  });

  it('createLeave → 400 when startDate is after endDate', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: { id: userId },
      body: {
        startDate: '2025-12-31',
        endDate: '2025-12-30',
        leaveType: 'Sick',
        reason: 'Oops',
      },
    };
    const res = makeRes();

    const createStub = sinon.stub(Leave, 'create'); // should not be called

    await leaveController.createLeave(req, res);

    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });
});

/* --------------------------- SHIFT TESTS --------------------------- */

describe('Shift Controller (minimal tests)', () => {
  afterEach(() => sinon.restore());

  // tomorrow as YYYY-MM-DD
  const tomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  it('addShift → 403 for non-admin user', async () => {
    const employeeId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: { id: employeeId, role: 'user' },
      body: {
        userId: employeeId,
        shiftDate: tomorrowISO(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'CSR',
      },
    };
    const res = makeRes();

    const findStub = sinon.stub(Shift, 'find');   // should not be used
    const createStub = sinon.stub(Shift, 'create'); // should not be called

    await shiftController.addShift(req, res);

    expect(findStub.called).to.be.false;
    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });

  it('addShift → 400 for past date (no allowPast)', async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const employeeId = new mongoose.Types.ObjectId().toString();

    const pastISO = () => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return d.toISOString().slice(0, 10);
    };

    const req = {
      user: { id: adminId, role: 'admin' },
      body: {
        userId: employeeId,
        shiftDate: pastISO(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Cashier',
      },
    };
    const res = makeRes();

    const findStub = sinon.stub(Shift, 'find');   // should not be used
    const createStub = sinon.stub(Shift, 'create'); // should not be called

    await shiftController.addShift(req, res);

    expect(findStub.called).to.be.false;
    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });
});
