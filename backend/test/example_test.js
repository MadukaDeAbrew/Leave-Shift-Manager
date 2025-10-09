// test/example_test.js

const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Leave = require('../models/Leave');
const User = require('../models/User');
const ShiftService = require('../shiftserver'); // ✅ instead of Shift

const leaveController = require('../controllers/leaveController');
const shiftController = require('../controllers/shiftController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const employeeController = require('../controllers/employeeController');

const { expect } = chai;

// helper response object
function makeRes() {
  return {
    status: sinon.stub().returnsThis(),
    json: sinon.spy(),
  };
}

/* --------------------------- LEAVE TESTS --------------------------- */
describe('Leave Controller (unit)', () => {
  afterEach(() => sinon.restore());

  it('createLeave - 201 and returns created leave', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: { id: userId },
      body: {
        startDate: '2025-12-30',
        endDate: '2025-12-31',
        leaveType: 'Annual',
        reason: 'Family Function',
      },
    };
    const res = makeRes();

    // stub User.findById
    sinon.stub(User, 'findById').resolves({ firstName: 'John', lastName: 'Doe' });

    const created = { _id: new mongoose.Types.ObjectId(), userId, ...req.body, status: 'Pending' };
    sinon.stub(Leave, 'create').resolves(created);

    await leaveController.createLeave(req, res);

    expect(Leave.create.calledOnce).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ userId, leaveType: 'Annual' })).to.be.true;
  });

  it('createLeave - 400 when startDate is after endDate', async () => {
    const req = {
      user: { id: new mongoose.Types.ObjectId().toString() },
      body: { startDate: '2025-12-31', endDate: '2025-12-30', leaveType: 'Sick', reason: 'fever' },
    };
    const res = makeRes();

    sinon.stub(User, 'findById').resolves({ firstName: 'John' }); // still needed
    const createStub = sinon.stub(Leave, 'create');

    await leaveController.createLeave(req, res);

    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });
});

/* --------------------------- SHIFT TESTS --------------------------- */
describe('Shift Controller (unit)', () => {
  afterEach(() => sinon.restore());

  it('addShift - 403 for non-admin user', async () => {
    const req = { user: { id: 'u1', systemRole: 'user' }, body: { shiftDate: '2025-12-10', slotKey: 'M1' } };
    const res = makeRes();

    await shiftController.addShift(req, res);

    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });

  it('addShift - 201 for admin', async () => {
    const req = {
      user: { id: 'admin1', systemRole: 'admin' },
      body: { shiftDate: '2025-12-10', slotKey: 'M1', jobRole: 'cashier', title: 'Morning' },
    };
    const res = makeRes();

    const fakeShift = { id: 1, jobRole: 'cashier' };
    sinon.stub(ShiftService, 'create').resolves(fakeShift);

    await shiftController.addShift(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(fakeShift)).to.be.true;
  });
});

/* --------------------------- AUTH TESTS --------------------------- */
describe('Auth Controller (unit)', () => {
  afterEach(() => sinon.restore());

  it('changePassword - 200 success', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const req = { user: { _id: userId }, body: { oldPassword: 'oldPass', newPassword: 'newPass' } };
    const res = makeRes();

    const userMock = { _id: userId, password: await bcrypt.hash('oldPass', 10), save: sinon.stub().resolvesThis() };
    const selectStub = sinon.stub().resolves(userMock);
    sinon.stub(User, 'findById').returns({ select: selectStub });

    sinon.stub(bcrypt, 'compare').resolves(true);
    sinon.stub(bcrypt, 'hash').resolves('hashedNewPass');

    await authController.changePassword(req, res);

    expect(res.json.calledWithMatch({ message: 'Password updated successfully.' })).to.be.true;
  });
});

/* --------------------------- USER TESTS --------------------------- */
describe('User Controller (unit)', () => {
  afterEach(() => sinon.restore());

  it('getUsers - returns list', async () => {
    const fakeUsers = [
      { _id: new mongoose.Types.ObjectId(), firstName: 'John' },
      { _id: new mongoose.Types.ObjectId(), firstName: 'Jane' },
    ];
    const limitStub = sinon.stub().resolves(fakeUsers);
    const skipStub = sinon.stub().returns({ limit: limitStub });
    sinon.stub(User, 'find').returns({ skip: skipStub });
    sinon.stub(User, 'countDocuments').resolves(fakeUsers.length);

    const req = { query: { page: 1, limit: 10 } };
    const res = makeRes();
    await userController.getUsers(req, res);

    expect(res.json.calledWithMatch({ users: sinon.match.array, total: fakeUsers.length })).to.be.true;
  });

  it('getUsers - 500 on error', async () => {
    sinon.stub(User, 'find').returns({ skip: () => ({ limit: () => Promise.reject(new Error('DB Error')) }) });
    const req = { query: { page: 1, limit: 10 } };
    const res = makeRes();

    await userController.getUsers(req, res);

    expect(res.status.calledOnceWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

/* --------------------------- EMPLOYEE TESTS --------------------------- */
describe('Employee Controller (unit)', () => {
  afterEach(() => sinon.restore());

  it('getEmployees - returns employees', async () => {
    const employees = [{ _id: new mongoose.Types.ObjectId(), firstName: 'Alice' }];
    sinon.stub(User, 'find').returns({ select: sinon.stub().resolves(employees) });
    const req = {}; const res = makeRes();

    await employeeController.getEmployees(req, res);
    expect(res.json.calledWith(employees)).to.be.true;
  });

  it('createEmployee - 201 success', async () => {
    const req = { body: { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' } };
    const res = makeRes();
    sinon.stub(User, 'findOne').resolves(null);
    const newUser = { _id: new mongoose.Types.ObjectId(), ...req.body };
    sinon.stub(User, 'create').resolves(newUser);

    await employeeController.createEmployee(req, res);
    expect(res.status.calledWith(201)).to.be.true;
  });

  it('createEmployee - 409 if email exists', async () => {
    const req = { body: { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' } };
    const res = makeRes();
    sinon.stub(User, 'findOne').resolves({ _id: '123', email: 'alice@example.com' });

    await employeeController.createEmployee(req, res);
    expect(res.status.calledWith(409)).to.be.true;
  });
});
