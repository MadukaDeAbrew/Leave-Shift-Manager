/*
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Task = require('../models/Task'); // Import Task model
const { createTask } = require('../controllers/taskController'); // Import function
const { expect } = chai;
describe('Task Controller - createTask', () => {
    // The it() function in Mocha is used to define a test case 1.
it('should create a new task successfully', async () => {
// Mock request data: Simulates an incoming HTTP request with a mock task ID.
const req = {
user: { id: new mongoose.Types.ObjectId() },
body: { title: "New Task", description: "Task description", deadline: "2025-12-
31" }};
//Mock task that would be created
const createdTask = { _id: new mongoose.Types.ObjectId(), ...req.body, userId:
req.user.id };
// Stub Task.create to return the createdTask
const createStub = sinon.stub(Task, 'create').resolves(createdTask);
// Mock response object: Mocking Database Response
const res = {
status: sinon.stub().returnsThis(),
json: sinon.spy()
};
// Call function
await addTask(req, res);
// Assertions: verifies whether a certain condition is true during the execution of a test. It ensures
that the code behaves as expected.
expect(createStub.calledOnceWith({ userId: req.user.id, ...req.body })).to.be.true;
expect(res.status.calledWith(201)).to.be.true;
expect(res.json.calledWith(createdTask)).to.be.true;
// Restore stubbed methods: is used to clean up or reset any mocked or stubbed methods or
functions after a test case has run.
createStub.restore();
});
Test Case 2: Task Creation Error
// The it() function in Mocha is used to define a test case 2.
it('should return 500 if an error occurs', async () => {
/ Stub Task.Create to throw an error
const createStub = sinon.stub(Task, 'create').throws(new Error('DB Error'));
// Mock request data
const req = {
user: { id: new mongoose.Types.ObjectId() },
body: { title: "New Task", description: "Task description", deadline: "2025-12-
31" }
};
// Mock response object
const res = {
status: sinon.stub().returnsThis(),
json: sinon.spy()
};
// Call function
await addTask(req, res);
// Assertions
expect(res.status.calledWith(500)).to.be.true;
expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
// Restore stubbed methods
createStub.restore();});
// Closing the describe method
});


*/


// backend/test/example_test.js
/* eslint-disable no-unused-expressions */
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const { expect } = chai;

// Real controllers
const leaveController = require('../controllers/leaveController');
const shiftController = require('../controllers/shiftController');

// Real models (we stub methods on these)
const Leave = require('../models/Leave');
const Shift = require('../models/Shift');

// ---------- helpers ----------
const sameLocalDate = (a, b) =>
  a instanceof Date &&
  b instanceof Date &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Test response that resolves a promise when:
 *  - res.status(...).json/send/end is called
 *  - res.sendStatus(...) is called
 *  - OR (safety) status was set to 201 but no body method was invoked shortly after
 */
const makeResolvableRes = () => {
  const res = {
    statusCode: undefined,
  };

  let resolved = false;
  let resolveDone;

  const resolveOnce = () => {
    if (!resolved) {
      resolved = true;
      if (resolveDone) resolveDone();
    }
  };

  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });

  res.status = sinon.stub().callsFake((code) => {
    res.statusCode = code;
    return {
      json: (payload) => {
        res.json(payload);
        resolveOnce();
        return res;
      },
      send: (payload) => {
        res.send(payload);
        resolveOnce();
        return res;
      },
      end: () => {
        res.end();
        resolveOnce();
        return res;
      },
    };
  });

  res.json = sinon.spy(() => resolveOnce());
  res.send = sinon.spy(() => resolveOnce());
  res.end = sinon.spy(() => resolveOnce());
  res.sendStatus = sinon.spy((code) => {
    res.statusCode = code;
    resolveOnce();
    return res;
  });

  // Safety: if status(201) is set but body never sent, resolve soon anyway
  setTimeout(() => {
    if (res.statusCode === 201) resolveOnce();
  }, 50);

  return { res, done };
};

// ========== Leave tests ==========
describe('leaveController.createLeave', () => {
  afterEach(() => sinon.restore());

  it('should create a leave request (201) on valid input', async () => {
    const userId = new mongoose.Types.ObjectId();
    const req = {
      user: { id: userId },
      body: {
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        leaveType: 'Annual',
        reason: 'Trip',
      },
    };
    const { res, done } = makeResolvableRes();

    const created = { _id: new mongoose.Types.ObjectId(), userId, ...req.body, status: 'Pending' };
    const createStub = sinon.stub(Leave, 'create').resolves(created);

    await leaveController.createLeave(req, res);
    await done;

    expect(createStub.calledOnce).to.equal(true);
    const arg = createStub.firstCall.args[0];
    expect(arg.userId.toString()).to.equal(userId.toString());
    expect(arg.leaveType).to.equal('Annual');
    expect(res.status.calledWith(201)).to.equal(true);
    // res.json already spied inside helper — don't spy again
    expect(res.json.called).to.equal(true);
  });

  it('should return 400 if startDate is after endDate', async () => {
    const userId = new mongoose.Types.ObjectId();
    const req = {
      user: { id: userId },
      body: {
        startDate: '2025-12-10',
        endDate: '2025-12-01',
        leaveType: 'Annual',
        reason: 'Nope',
      },
    };
    const { res, done } = makeResolvableRes();
    const createStub = sinon.stub(Leave, 'create');

    await leaveController.createLeave(req, res);
    await done;

    expect(res.status.calledWith(400)).to.equal(true);
    expect(createStub.called).to.equal(false);
  });
});

// ========== Shift tests ==========
describe('shiftController.addShift', () => {
  afterEach(() => sinon.restore());

  it('should create a shift (201) for admin with valid, non-overlapping times', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const dateStr = '2025-12-31';

    const req = {
      user: { id: adminId, role: 'admin' },
      body: {
        userId: adminId.toString(),
        shiftDate: dateStr,
        startTime: '09:00',
        endTime: '17:00',
        role: 'Nurse',
      },
    };

    const { res, done } = makeResolvableRes();

    // No overlaps
    const findStub = sinon.stub(Shift, 'find').resolves([]);

    const created = {
      _id: new mongoose.Types.ObjectId(),
      userId: adminId,
      shiftDate: new Date(dateStr),
      startTime: '09:00',
      endTime: '17:00',
      role: 'Nurse',
      status: 'Scheduled',
    };
    const createStub = sinon.stub(Shift, 'create').resolves(created);

    // run controller
    await shiftController.addShift(req, res);
    await done;

    expect(findStub.calledOnce).to.equal(true);
    expect(createStub.calledOnce).to.equal(true);
    const data = createStub.firstCall.args[0];

    expect(data.userId.toString()).to.equal(adminId.toString());
    expect(data.startTime).to.equal('09:00');
    expect(data.endTime).to.equal('17:00');
    expect(data.role).to.equal('Nurse');
    expect(data.status).to.equal('Scheduled');
    expect(data.shiftDate).to.be.instanceOf(Date);
    expect(sameLocalDate(data.shiftDate, new Date(dateStr))).to.equal(true);

    // any 201 path is okay
    const got201 =
      res.status.calledWith(201) ||
      res.sendStatus.calledWith(201);
    expect(got201).to.equal(true);
  });

  it('should 400 when date is in the past and allowPast is not set', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const req = {
      user: { id: adminId, role: 'admin' },
      body: {
        userId: adminId.toString(),
        shiftDate: yesterday.toISOString().slice(0, 10),
        startTime: '09:00',
        endTime: '17:00',
        role: 'Cashier',
      },
    };

    const { res, done } = makeResolvableRes();
    const findStub = sinon.stub(Shift, 'find');     // not reached
    const createStub = sinon.stub(Shift, 'create'); // not reached

    await shiftController.addShift(req, res);
    await done;

    expect(res.status.calledWith(400)).to.equal(true);
    expect(findStub.called).to.equal(false);
    expect(createStub.called).to.equal(false);
  });

  it('should 409 when new shift overlaps an existing one for same user/day', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const dateStr = '2025-09-01';

    const req = {
      user: { id: adminId, role: 'admin' },
      body: {
        userId: adminId.toString(),
        shiftDate: dateStr,
        startTime: '11:00',
        endTime: '13:00',
        role: 'Cashier',
      },
    };

    const { res, done } = makeResolvableRes();

    const findStub = sinon.stub(Shift, 'find').resolves([{ startTime: '10:00', endTime: '12:00' }]);
    const createStub = sinon.stub(Shift, 'create'); // not reached

    await shiftController.addShift(req, res);
    await done;

    expect(findStub.calledOnce).to.equal(true);
    expect(res.status.calledWith(409)).to.equal(true);
    expect(createStub.called).to.equal(false);
  });

  it('should 403 if a non-admin tries to add a shift', async () => {
    const userId = new mongoose.Types.ObjectId();

    const req = {
      user: { id: userId, role: 'user' },
      body: {
        userId: userId.toString(),
        shiftDate: '2025-09-01',
        startTime: '09:00',
        endTime: '17:00',
        role: 'Any',
      },
    };

    const { res, done } = makeResolvableRes();
    const findStub = sinon.stub(Shift, 'find');     // not reached
    const createStub = sinon.stub(Shift, 'create'); // not reached

    await shiftController.addShift(req, res);
    await done;

    expect(res.status.calledWith(403)).to.equal(true);
    expect(findStub.called).to.equal(false);
    expect(createStub.called).to.equal(false);
  });
});
