const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Helpers
const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const trimStr = (v = "") => String(v).trim();

// --- POST /api/auth/register ---
const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      employmentType,
      jobRole,
      joinedDate,
      salaryPerHour,
      systemRole,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !employeeId || !employmentType || !jobRole || !joinedDate) {
      return res
        .status(400)
        .json({ message: "Required fields: firstName, lastName, email, password, employeeId, employmentType, jobRole, joinedDate" });
    }

    const normEmail = normalizeEmail(email);

    // Password strength check
    const strongPwd =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(password);
    if (!strongPwd) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include upper, lower, number, and special character.",
      });
    }

    // Unique email check
    const exists = await User.findOne({ email: normEmail }).lean();
    if (exists) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName: trimStr(firstName),
      lastName: trimStr(lastName),
      email: normEmail,
      password: hash,
      systemRole: systemRole || "employee", // default employee
      employeeId,
      employmentType,
      jobRole: jobRole.trim(),
      joinedDate,
      salaryPerHour,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      systemRole: user.systemRole,
      token: generateToken(user.id),
    });
  } catch (e) {
    if (e?.code === 11000 && e?.keyPattern?.email) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }
    console.error("registerUser error:", e);
    return res.status(500).json({ message: "Server error during registration." });
  }
};

// --- POST /api/auth/login ---
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        systemRole: user.systemRole,
        jobRole: user.jobRole,
        employmentType: user.employmentType,
        phone: user.phone,
        pronouns: user.pronouns,
        secondaryEmail: user.secondaryEmail,
        address: user.address,
      },
    });
  } catch (e) {
    console.error("loginUser error:", e);
    return res.status(500).json({ message: "Server error during login." });
  }
};

// --- GET /api/auth/profile (protected) ---
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      systemRole: user.systemRole,
      jobRole: user.jobRole,
      employmentType: user.employmentType,
      phone: user.phone,
      pronouns: user.pronouns,
      secondaryEmail: user.secondaryEmail,
      address: user.address,
      dob: user.dob,
    });
  } catch (e) {
    console.error("getProfile error:", e);
    return res.status(500).json({ message: "Server error fetching profile." });
  }
};

// --- PUT /api/auth/profile (protected) ---
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { firstName, lastName, email, phone, pronouns, secondaryEmail, address, dob } =
      req.body;

    if (firstName !== undefined) user.firstName = trimStr(firstName) || user.firstName;
    if (lastName !== undefined) user.lastName = trimStr(lastName) || user.lastName;
    if (email !== undefined) user.email = normalizeEmail(email) || user.email;
    if (phone !== undefined) user.phone = trimStr(phone);
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (secondaryEmail !== undefined) user.secondaryEmail = normalizeEmail(secondaryEmail);
    if (address !== undefined) user.address = trimStr(address);
    if (dob !== undefined) user.dob = dob;

    const updated = await user.save();

    return res.json({
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone,
      pronouns: updated.pronouns,
      secondaryEmail: updated.secondaryEmail,
      address: updated.address,
      dob: updated.dob,
      systemRole: updated.systemRole,
      jobRole: updated.jobRole,
      employmentType: updated.employmentType,
      token: generateToken(updated.id), // keep session alive
    });
  } catch (e) {
    console.error("updateUserProfile error:", e);
    return res.status(500).json({ message: "Server error updating profile." });
  }
};

// --- PUT /api/auth/change-password (protected) ---
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Old password incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (e) {
    console.error("changePassword error:", e);
    return res.status(500).json({ message: "Server error changing password." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateUserProfile,
  changePassword,
};
