// this include s + admin users
const express = require("express");
const bcrypt = require("bcrypt");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/User"); // reuse User model

const router = express.Router();

// === GET all s ===
/*
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const s = await Employee.find({ systemRole: "employeeect("-password").lean();
    res.json(s);
  } catch (e) {
    console.error("Fetch s error:", e);
    res.status(500).json({ message: "Server error fetching s" });
  }
});
*/

// === GET all users ===
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").lean(); // no filter
    res.json(users);
  } catch (e) {
    console.error("Fetch users error:", e);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// === POST create new user ( or admin) ===
// === POST create a new employee (admin only) ===
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      jobRole,
      employmentType,
      joinedDate,
      systemRole
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("TempPass123!", salt);

    // ✅ FIX: define employeeId correctly
    const employeeId = `EMP${Date.now()}`;

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      systemRole: systemRole === "admin" ? "admin" : "employee",
      firstName: firstName || "New",
      lastName: lastName || "User",
      jobRole: jobRole || "Unassigned",
      employmentType: employmentType || "Full Time",
      joinedDate: joinedDate || new Date(),
      employeeId: employeeId, // ✅ include generated ID
    });

    res.status(201).json({
      id: newUser._id,
      employeeId: newUser.employeeId,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      jobRole: newUser.jobRole,
      employmentType: newUser.employmentType,
      joinedDate: newUser.joinedDate,
      systemRole: newUser.systemRole,
    });
  } catch (e) {
    console.error("Create user error:", e);
    res.status(500).json({ message: "Server error creating user" });
  }
});

// === PUT update employee ===
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if employeeId is taken (excluding current user)
    if (updates.employeeId) {
      const exists = await User.findOne({
        employeeId: updates.employeeId,
        _id: { $ne: id },
      });
      if (exists) {
        return res.status(400).json({ message: "Employee ID already exists." });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(user);
  } catch (e) {
    console.error("Update employee error:", e);
    res.status(500).json({ message: "Server error updating employee." });
  }
});


// === DELETE employee ===
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
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
