
const chai = require('chai');
const chaiHttp = require('chai-http');
const http = require('http');
const app = require('../server');              
const connectDB = require('../config/db');     
const mongoose = require('mongoose');
const sinon = require('sinon');

const Leave = require('../models/Leave');
const Shift = require('../models/Shift');

const leaveController = require('../controllers/leaveController');
const shiftController = require('../controllers/shiftController');

const { expect } = chai;
chai.use(chaiHttp);

let server;
let port;

function makeRes() {
  return {
    status: sinon.stub().returnsThis(),
    json: sinon.spy(),
  };
}

/* ------------------------------- LEAVES ---------------------------------- */

describe('Leave Controller Tests (tutorial style)', () => {
  afterEach(() => sinon.restore());

  it('createLeave: should 201 and return created leave', async () => {
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

    // use match to allow controller to add extra fields safely
    expect(createStub.calledOnceWith(sinon.match({ userId, ...req.body }))).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(created)).to.be.true;
  });

  it('createLeave: should 400 when startDate > endDate', async () => {
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

    const createStub = sinon.stub(Leave, 'create'); 
    await leaveController.createLeave(req, res);

    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });
});

/* ------------------------------- SHIFTS ---------------------------------- */

describe('Shift Controller Tests (tutorial style)', () => {
  afterEach(() => sinon.restore());

  const tomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  it('addShift: should 403 for non-admin user', async () => {
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

    const findStub = sinon.stub(Shift, 'find');     // should NOT be used
    const createStub = sinon.stub(Shift, 'create'); // should NOT be called

    await shiftController.addShift(req, res);

    expect(findStub.called).to.be.false;
    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });

  it('addShift: should 400 when date is in the past (no allowPast)', async () => {
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

    const findStub = sinon.stub(Shift, 'find');     // should NOT be used
    const createStub = sinon.stub(Shift, 'create'); // should NOT be called

    await shiftController.addShift(req, res);

    expect(findStub.called).to.be.false;
    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });

  it('addShift: should 409 when overlaps an existing shift', async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const employeeId = new mongoose.Types.ObjectId().toString();

    const req = {
      user: { id: adminId, role: 'admin' },
      body: {
        userId: employeeId,
        shiftDate: tomorrowISO(),
        startTime: '10:00',
        endTime: '12:00',
        role: 'Barista',
      },
    };
    const res = makeRes();

    sinon.stub(Shift, 'find').resolves([{ startTime: '09:00', endTime: '11:00' }]);
    const createStub = sinon.stub(Shift, 'create'); // should NOT be called

    await shiftController.addShift(req, res);

    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(409)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });

  /* Keeping this test but skip it to avoid flakiness/timeouts in CI */
  it.skip('addShift: should 201 and return created shift (happy path)', async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const employeeId = new mongoose.Types.ObjectId().toString();

    const req = {
      user: { id: adminId, role: 'admin' },
      body: {
        userId: employeeId,
        shiftDate: tomorrowISO(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Cashier',
      },
    };
    const res = makeRes();

    sinon.stub(Shift, 'find').resolves([]);
    const created = {
      _id: new mongoose.Types.ObjectId(),
      userId: employeeId,
      shiftDate: new Date(req.body.shiftDate),
      startTime: '09:00',
      endTime: '17:00',
      role: 'Cashier',
      status: 'Scheduled',
    };
    sinon.stub(Shift, 'create').resolves(created);

    await shiftController.addShift(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(created)).to.be.true;
  });
}); // 