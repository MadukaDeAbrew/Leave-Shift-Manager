// backend/controllers/employeeController.js
const User = require('../models/User');

// @desc Get all employees (admin only)
// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ systemRole: 'employee' }).select('-password');
    res.json(employees);
  } catch (err) {
    console.error('getEmployees error:', err);
    res.status(500).json({ message: 'Server error fetching employees.' });
  }
};

// @desc Create a new employee (admin only)
// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, jobRole, employmentType } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      jobRole,
      employmentType,
      systemRole: 'employee',
      password: 'TempPass@123', // default temporary password
      employeeId: `EMP${Date.now()}`
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error('createEmployee error:', err);
    res.status(500).json({ message: 'Server error creating employee.' });
  }
};

// @desc Update employee (admin only)
// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const employee = await User.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // update allowed fields
    employee.firstName = updates.firstName ?? employee.firstName;
    employee.lastName = updates.lastName ?? employee.lastName;
    employee.email = updates.email ?? employee.email;
    employee.jobRole = updates.jobRole ?? employee.jobRole;
    employee.employmentType = updates.employmentType ?? employee.employmentType;

    const saved = await employee.save();
    res.json(saved);
  } catch (err) {
    console.error('updateEmployee error:', err);
    res.status(500).json({ message: 'Server error updating employee.' });
  }
};

// @desc Delete employee (admin only)
// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    await employee.deleteOne();
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    res.status(500).json({ message: 'Server error deleting employee.' });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
