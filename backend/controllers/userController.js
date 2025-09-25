const User = require("../models/User");

// === List (Admin only) ===
// Returns paginated array of employees → List
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments();

    res.json({ users, total }); // List (Array)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Dictionary: Get user by ID (Admin only) ===
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user); // Dictionary (key-value pairs)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Memento Pattern: Update user (Admin only) ===
exports.updateUser = async (req, res) => {
  try {
    const oldUser = await User.findById(req.params.id);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    // Save snapshot (Memento)
    const snapshot = { ...oldUser._doc };

    const {
      firstName,
      lastName,
      jobRole,
      employmentType,
      joinedDate,
      salaryPerHour,
    } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        jobRole: jobRole?.trim(),
        employmentType,
        joinedDate,
        salaryPerHour,
      },
      { new: true }
    );

    res.json({ updated, previous: snapshot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Set: Unique Job Roles (Admin only) ===
exports.getUniqueJobRoles = async (req, res) => {
  try {
    const users = await User.find().select("jobRole");
    const roles = new Set(users.map((u) => u.jobRole?.trim().toLowerCase())); // Set ensures uniqueness
    const normalizedRoles = [...roles].map(
      (r) => r.charAt(0).toUpperCase() + r.slice(1)
    );
    res.json(normalizedRoles); // Set → Array
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Enum: Employment Types ===
exports.getEmploymentTypes = (req, res) => {
  res.json(["Full Time", "Part Time", "Casual"]);
};
