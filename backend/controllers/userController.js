const User = require("../models/User");
const { wrapUser } = require("../models/UserType");

//Used List (Admin only) ===
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments();
    res.json({ users: users.map(wrapUser), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Used Dictionary ===
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(wrapUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Used Update (Memento) ===
exports.updateUser = async (req, res) => {
  try {
    const oldUser = await User.findById(req.params.id);
    if (!oldUser) return res.status(404).json({ message: "User not found" });

    const snapshot = wrapUser(oldUser);

    const updates = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json({ updated: wrapUser(updated), previous: snapshot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Used Set: Unique Job Roles ===
exports.getUniqueJobRoles = async (req, res) => {
  try {
    const users = await User.find().select("jobRole");
    const roles = new Set(users.map((u) => u.jobRole?.trim().toLowerCase()));
    const normalized = [...roles].map((r) => r.charAt(0).toUpperCase() + r.slice(1));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Used Enum: Employment Types ===
exports.getEmploymentTypes = (_req, res) => {
  res.json(["Full Time", "Part Time", "Casual", "Contract"]);
};
