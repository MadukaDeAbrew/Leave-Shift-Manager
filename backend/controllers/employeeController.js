const Employee = require("../models/Employee");

// === List ===
// Employee list is returned as an Array (list) for pagination
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const employees = await Employee.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Employee.countDocuments();
    res.json({ employees, total }); // employees is a List (Array)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Dictionary ===
// Single Employee is returned as a key-value JSON object (dictionary)
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee); // employee is a Dictionary (JSON key-value pairs)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Memento (Behavioural Pattern) ===
// Update Employee while saving a snapshot (old state)
exports.updateEmployee = async (req, res) => {
  try {
    // Step 1: Fetch the current (old) state before update
    const oldEmployee = await Employee.findById(req.params.id);
    if (!oldEmployee) return res.status(404).json({ message: "Employee not found" });

    // Save a snapshot (Memento)
    const snapshot = { ...oldEmployee._doc };

    // Step 2: Apply the update
    const { role, employmentType, joinedDate, salaryPerHour } = req.body;
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        role: role.trim(), // normalize role input
        employmentType,
        joinedDate,
        salaryPerHour 
      },
      { new: true }
    );

    // Step 3: Return both updated state + snapshot
    res.json({ updated, previous: snapshot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Set (with normalization) ===
// Unique roles for dropdown (no duplicates, case-insensitive)
exports.getUniqueRoles = async (req, res) => {
  try {
    const employees = await Employee.find().select("role");
    const roles = new Set(
      employees.map(e => e.role.trim().toLowerCase()) // normalize to lowercase
    );
    // Capitalize first letter for UI
    const normalizedRoles = [...roles].map(
      r => r.charAt(0).toUpperCase() + r.slice(1)
    );
    res.json(normalizedRoles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Fixed Enum Values ===
// Employment types are fixed, return as list
exports.getEmploymentTypes = (req, res) => {
  res.json(["Full Time", "Part Time", "Casual"]);
};
