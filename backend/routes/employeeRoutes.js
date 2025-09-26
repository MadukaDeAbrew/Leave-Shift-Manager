// this include employees + admin users
const express = require("express");
const bcrypt = require("bcrypt");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Employee = require("../models/User"); // reuse User model

const router = express.Router();

// === GET all employees ===
/*
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const employees = await Employee.find({ systemRole: "employee" }).select("-password").lean();
    res.json(employees);
  } catch (e) {
    console.error("Fetch employees error:", e);
    res.status(500).json({ message: "Server error fetching employees" });
  }
});
*/

// === GET all users ===
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await Employee.find().select("-password").lean(); // no filter
    res.json(users);
  } catch (e) {
    console.error("Fetch users error:", e);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// === POST create new employee ===
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, jobRole, employmentType, joinedDate } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const exists = await Employee.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Employee with this email already exists." });
    }

    // Hash a default temp password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("TempPass123!", salt);

    const newEmployee = await Employee.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      systemRole: "employee",
      firstName: firstName || "New",
      lastName: lastName || "Employee",
      jobRole: jobRole || "Unassigned",
      employmentType: employmentType || "Full Time",
      joinedDate: joinedDate || new Date(),
      employeeId: `EMP${Date.now()}`,
    });

    res.status(201).json({
      id: newEmployee._id,
      email: newEmployee.email,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      jobRole: newEmployee.jobRole,
      employmentType: newEmployee.employmentType,
      joinedDate: newEmployee.joinedDate,
      employeeId: newEmployee.employeeId,
    });
  } catch (e) {
    console.error("Create employee error:", e);
    res.status(500).json({ message: "Server error creating employee" });
  }
});

// === PUT update employee ===
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.firstName = updates.firstName ?? employee.firstName;
    employee.lastName = updates.lastName ?? employee.lastName;
    employee.jobRole = updates.jobRole ?? employee.jobRole;
    employee.employmentType = updates.employmentType ?? employee.employmentType;
    employee.joinedDate = updates.joinedDate ?? employee.joinedDate;

    await employee.save();

    res.json({
      id: employee._id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobRole: employee.jobRole,
      employmentType: employee.employmentType,
      joinedDate: employee.joinedDate,
      employeeId: employee.employeeId,
    });
  } catch (e) {
    console.error("Update employee error:", e);
    res.status(500).json({ message: "Server error updating employee" });
  }
});

// === DELETE employee ===
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee deleted" });
  } catch (e) {
    console.error("Delete employee error:", e);
    res.status(500).json({ message: "Server error deleting employee" });
  }
});

module.exports = router;
