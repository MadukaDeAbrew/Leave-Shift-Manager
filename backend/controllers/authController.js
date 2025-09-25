const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Helpers
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const trimStr = (v = '') => String(v).trim();

// --- POST /api/auth/register ---
const registerUser = async (req, res) => {
  try {
    const name = trimStr(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Strong password rule
    const strongPwd =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(password);
    if (!strongPwd) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include upper, lower, number, and special character.',
      });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hash });

    return res.status(201).json({
      message: 'User registered successfully.',
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (e) {
    if (e?.code === 11000 && e?.keyPattern?.email) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    console.error('registerUser error:', e);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// --- POST /api/auth/login ---
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        pronouns: user.pronouns,
        secondaryEmail: user.secondaryEmail,
        address: user.address,
        jobRole: user.jobRole,
        employmentType: user.employmentType,
        employeeId: user.employeeId,
        joinedDate: user.joinedDate,
      },
    });
  } catch (e) {
    console.error('loginUser error:', e);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// --- GET /api/auth/profile ---
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (e) {
    console.error('getProfile error:', e);
    return res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

// --- PUT /api/auth/profile ---
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      name,
      email,
      phone,
      pronouns,
      secondaryEmail,
      address,
      employeeId,
      joinedDate,
      jobRole,
      employmentType,
    } = req.body;

    // Normal users cannot change employee-only fields
    if (user.role === 'user') {
      if (employeeId || joinedDate || jobRole || employmentType) {
        return res.status(403).json({ message: 'Not authorized to change employee details.' });
      }
    } else if (user.role === 'admin') {
      // Admins can update employee fields
      if (employeeId !== undefined) user.employeeId = employeeId;
      if (joinedDate !== undefined) user.joinedDate = joinedDate;
      if (jobRole !== undefined) user.jobRole = jobRole;
      if (employmentType !== undefined) user.employmentType = employmentType;
    }

    // Shared fields
    if (name !== undefined) user.name = trimStr(name) || user.name;
    if (email !== undefined) user.email = normalizeEmail(email) || user.email;
    if (phone !== undefined) user.phone = trimStr(phone);
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (secondaryEmail !== undefined) user.secondaryEmail = normalizeEmail(secondaryEmail);
    if (address !== undefined) user.address = trimStr(address);

    const updated = await user.save();
    return res.json({
      message: 'Profile updated',
      user: updated,
      token: generateToken(updated.id),
    });
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
};

// --- PUT /api/auth/change-password ---
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new password are required.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Old password is incorrect.' });

    const strongPwd =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(newPassword);
    if (!strongPwd) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include upper, lower, number, and special character.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    return res.json({ message: 'Password updated successfully.' });
  } catch (e) {
    console.error('changePassword error:', e);
    return res.status(500).json({ message: 'Server error changing password.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
  getProfile,
  changePassword,
};
