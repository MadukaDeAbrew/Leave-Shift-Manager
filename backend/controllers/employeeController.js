// controllers/employeeController.js
const Employee = require("../models/Employee");

// GET all employees (with pagination)
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const employees = await Employee.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Employee.countDocuments();
    res.json({ employees, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single employee
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE employee
exports.updateEmployee = async (req, res) => {
  try {
    const { role, employmentType, joinedDate, salaryPerHour } = req.body;
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { role, employmentType, joinedDate, salaryPerHour },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Employee not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
