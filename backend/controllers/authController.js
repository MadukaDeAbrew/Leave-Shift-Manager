const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// === Helpers ===
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, systemRole: user.systemRole },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const trimStr = (v = '') => String(v).trim();

// === Register ===
const registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      systemRole,
      firstName,
      lastName,
      employeeId,
      jobRole,
      employmentType,
      joinedDate,
      phone,
      pronouns,
      secondaryEmail,
      address,
      dob,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Strong password check
    const strongPwd =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(password);
    if (!strongPwd) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include upper, lower, number, and special character.',
      });
    }

    const exists = await User.findOne({ email: normalizeEmail(email) }).lean();
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizeEmail(email),
      password: hash,
      systemRole: systemRole || 'employee',

      // Employee defaults
      firstName: firstName || 'New',
      lastName: lastName || 'Employee',
      employeeId: employeeId || `EMP${Date.now()}`,
      jobRole: jobRole || 'Unassigned',
      employmentType: employmentType || 'Full Time',
      joinedDate: joinedDate || new Date(),
      salaryPerHour: null,

      // Personal
      phone: phone || '',
      pronouns: pronouns || 'prefer not to say',
      secondaryEmail: secondaryEmail || '',
      address: address || '',
      dob: dob || null,
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        email: user.email,
        systemRole: user.systemRole,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        jobRole: user.jobRole,
        employmentType: user.employmentType,
        joinedDate: user.joinedDate,
        phone: user.phone,
        pronouns: user.pronouns,
        secondaryEmail: user.secondaryEmail,
        address: user.address,
        dob: user.dob,
      },
      token: generateToken(user),
    });
  } catch (e) {
    if (e?.code === 11000 && e?.keyPattern?.email) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    console.error('registerUser error:', e);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// === Login ===
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

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        systemRole: user.systemRole,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        jobRole: user.jobRole,
        employmentType: user.employmentType,
        joinedDate: user.joinedDate,
        phone: user.phone,
        pronouns: user.pronouns,
        secondaryEmail: user.secondaryEmail,
        address: user.address,
        dob: user.dob,
      },
    });
  } catch (e) {
    console.error('loginUser error:', e);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// === Get Profile ===
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        systemRole: user.systemRole,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        employeeId: user.employeeId || '',
        jobRole: user.jobRole || '',
        employmentType: user.employmentType || '',
        joinedDate: user.joinedDate || null,
        salaryPerHour: user.salaryPerHour || null,
        phone: user.phone || '',
        pronouns: user.pronouns || 'prefer not to say',
        secondaryEmail: user.secondaryEmail || '',
        address: user.address || '',
        dob: user.dob || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    console.error('getProfile error:', e);
    return res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

// === Update Profile ===
// --- PUT /api/auth/profile ---
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      firstName,
      lastName,
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

    // Shared fields
    if (firstName !== undefined) user.firstName = trimStr(firstName);
    if (lastName !== undefined) user.lastName = trimStr(lastName);
    if (email !== undefined) user.email = normalizeEmail(email);
    if (phone !== undefined) user.phone = trimStr(phone);
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (secondaryEmail !== undefined) user.secondaryEmail = normalizeEmail(secondaryEmail);
    if (address !== undefined) user.address = trimStr(address);

    // Admin-only employee fields
    if (req.user.systemRole === 'admin') {     // 🔑 FIXED
      if (employeeId !== undefined) user.employeeId = employeeId;
      if (joinedDate !== undefined) user.joinedDate = joinedDate;
      if (jobRole !== undefined) user.jobRole = jobRole;
      if (employmentType !== undefined) user.employmentType = employmentType;
    }

    const updated = await user.save();
    return res.json({
      message: 'Profile updated',
      user: {
        id: updated._id,
        email: updated.email,
        systemRole: updated.systemRole,
        firstName: updated.firstName,
        lastName: updated.lastName,
        employeeId: updated.employeeId,
        jobRole: updated.jobRole,
        employmentType: updated.employmentType,
        joinedDate: updated.joinedDate,
        phone: updated.phone,
        pronouns: updated.pronouns,
        secondaryEmail: updated.secondaryEmail,
        address: updated.address,
        dob: updated.dob,
      },
      token: generateToken(updated.id),
    });
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
};


// === Change Password ===
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
  getProfile,
  updateUserProfile,
  changePassword,
};
