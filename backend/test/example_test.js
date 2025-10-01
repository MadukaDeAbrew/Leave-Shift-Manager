// unit tests per tutorial 9

const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Leave = require('../models/Leave');
const Shift = require('../models/Shift');
const User = require('../models/User');

const leaveController = require('../controllers/leaveController');
const shiftController = require('../controllers/shiftController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const employeeController = require('../controllers/employeeController'); // ✅ new

const { expect } = chai;

// Simple stubbed res object
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

    const created = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      ...req.body,
      status: 'Pending',
    };

    const createStub = sinon.stub(Leave, 'create').resolves(created);

    await leaveController.createLeave(req, res);

    expect(createStub.calledOnce).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch({ userId, leaveType: 'Annual' })).to.be.true;
  });

  it('createLeave - 400 when startDate is after endDate', async () => {
    const req = {
      user: { id: new mongoose.Types.ObjectId().toString() },
      body: {
        startDate: '2025-12-31',
        endDate: '2025-12-30',
        leaveType: 'Sick',
        reason: 'fever',
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

/* --------------------------- SHIFT TESTS --------------------------- */
describe('Shift Controller (unit)', () => {
  afterEach(() => sinon.restore());

  const tomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  it('addShift - 403 for non-admin user', async () => {
    const req = {
      user: { id: new mongoose.Types.ObjectId(), role: 'user' },
      body: {
        shiftDate: tomorrowISO(),
        startTime: '09:00',
        endTime: '17:00',
        role: 'receptionist',
      },
    };
    const res = makeRes();

    const createStub = sinon.stub(Shift, 'create');

    await shiftController.addShift(req, res);

    expect(createStub.called).to.be.false;
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });
});

/* --------------------------- AUTH TESTS --------------------------- */
describe('Auth Controller (unit)', () => {
  afterEach(() => sinon.restore());

  it('changePassword - 200 success', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: { _id: userId },
      body: { oldPassword: 'oldPass', newPassword: 'newPass' },
    };
    const res = makeRes();

    const userMock = {
      _id: userId,
      password: await bcrypt.hash('oldPass', 10),
      save: sinon.stub().resolvesThis(),
    };

    // Properly stub the chain: User.findById().select()
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
      { _id: new mongoose.Types.ObjectId(), firstName: 'John', email: 'j@ex.com' },
      { _id: new mongoose.Types.ObjectId(), firstName: 'Jane', email: 'jane@ex.com' },
    ];

    // Stub find() chain: skip() -limit() resolves fakeUsers
    const limitStub = sinon.stub().resolves(fakeUsers);
    const skipStub = sinon.stub().returns({ limit: limitStub });
    sinon.stub(User, 'find').returns({ skip: skipStub });

    sinon.stub(User, 'countDocuments').resolves(fakeUsers.length);

    const req = { query: { page: 1, limit: 10 } };
    const res = makeRes();

    await userController.getUsers(req, res);

    expect(User.find.calledOnce).to.be.true;
    expect(skipStub.calledWith(0)).to.be.true;
    expect(limitStub.calledWith(10)).to.be.true;
    expect(User.countDocuments.calledOnce).to.be.true;
    expect(res.json.calledWithMatch({ users: sinon.match.array, total: fakeUsers.length })).to.be.true;
  });

  it('getUsers - 500 on error', async () => {
    // Make the inner .limit() reject so controller hits catch
    sinon.stub(User, 'find').returns({
      skip: () => ({
        limit: () => Promise.reject(new Error('DB Error')),
      }),
    });

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
    const employees = [
      { _id: new mongoose.Types.ObjectId(), firstName: 'Alice', systemRole: 'employee' },
      { _id: new mongoose.Types.ObjectId(), firstName: 'Bob', systemRole: 'employee' }
    ];
    sinon.stub(User, 'find').returns({ select: sinon.stub().resolves(employees) });

    const req = {};
    const res = makeRes();

    await employeeController.getEmployees(req, res);

    expect(res.json.calledWith(employees)).to.be.true;
  });

  it('createEmployee - 201 success', async () => {
    const req = { body: { firstName: 'Alice', email: 'alice@example.com', jobRole: 'Dev' } };
    const res = makeRes();

    sinon.stub(User, 'findOne').resolves(null);
    const newUser = { _id: new mongoose.Types.ObjectId(), ...req.body, systemRole: 'employee' };
    sinon.stub(User, 'create').resolves(newUser);

    await employeeController.createEmployee(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWithMatch(newUser)).to.be.true;
  });

  it('createEmployee - 409 if email exists', async () => {
    const req = { body: { firstName: 'Alice', email: 'alice@example.com' } };
    const res = makeRes();

    sinon.stub(User, 'findOne').resolves({ _id: new mongoose.Types.ObjectId(), email: 'alice@example.com' });

    await employeeController.createEmployee(req, res);

    expect(res.status.calledWith(409)).to.be.true;
    expect(res.json.calledWithMatch({ message: sinon.match.string })).to.be.true;
  });

  it('updateEmployee - success', async () => {
    const id = new mongoose.Types.ObjectId();
    const req = { params: { id }, body: { firstName: 'Updated' } };
    const res = makeRes();

    const fakeEmployee = { _id: id, firstName: 'Old', save: sinon.stub().resolvesThis() };
    sinon.stub(User, 'findById').resolves(fakeEmployee);

    await employeeController.updateEmployee(req, res);

    expect(fakeEmployee.save.calledOnce).to.be.true;
    expect(res.json.calledWithMatch(fakeEmployee)).to.be.true;
  });

  it('updateEmployee - 404 if not found', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = makeRes();

    sinon.stub(User, 'findById').resolves(null);

    await employeeController.updateEmployee(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Employee not found' })).to.be.true;
  });

  it('deleteEmployee - success', async () => {
    const id = new mongoose.Types.ObjectId();
    const req = { params: { id } };
    const res = makeRes();

    const fakeEmployee = { _id: id, deleteOne: sinon.stub().resolves() };
    sinon.stub(User, 'findById').resolves(fakeEmployee);

    await employeeController.deleteEmployee(req, res);

    expect(fakeEmployee.deleteOne.calledOnce).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Employee deleted successfully' })).to.be.true;
  });

  it('deleteEmployee - 404 if not found', async () => {
    const req = { params: { id: new mongoose.Types.ObjectId() } };
    const res = makeRes();

    sinon.stub(User, 'findById').resolves(null);

    await employeeController.deleteEmployee(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'Employee not found' })).to.be.true;
  });
});
