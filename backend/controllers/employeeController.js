const Employee = require("../models/Employee");

// === Create Employee ===
exports.createEmployee = async (req, res) => {
  try {
    const { employeeId, firstName, lastName, employmentType, role, joinedDate, salaryPerHour } = req.body;

    if (!employeeId || !firstName || !lastName || !employmentType || !role || !joinedDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const employee = await Employee.create({
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      employmentType,
      role: role.trim(),
      joinedDate,
      salaryPerHour
    });

    res.status(201).json(employee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Employee ID must be unique" });
    }
    res.status(500).json({ message: error.message });
  }
};

// === List ===
// Employee list is returned as an Array (list) for pagination
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const employees = await Employee.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Employee.countDocuments();

    // Map employees to include fullName explicitly
    const employeesWithFullName = employees.map(emp => ({
      ...emp.toObject(),
      fullName: `${emp.firstName} ${emp.lastName}`
    }));

    res.json({ employees: employeesWithFullName, total });
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

    res.json({
      ...employee.toObject(),
      fullName: `${employee.firstName} ${employee.lastName}`
    });
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
    const { firstName, lastName, role, employmentType, joinedDate, salaryPerHour } = req.body;
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        role: role?.trim(),
        employmentType,
        joinedDate,
        salaryPerHour 
      },
      { new: true }
    );

    // Step 3: Return both updated state + snapshot
    res.json({ 
      updated: { ...updated.toObject(), fullName: `${updated.firstName} ${updated.lastName}` },
      previous: { ...snapshot, fullName: `${snapshot.firstName} ${snapshot.lastName}` }
    });
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
