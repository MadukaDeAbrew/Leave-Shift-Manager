const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { wrapUser } = require('../models/UserType');

const generateToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), systemRole: user.systemRole },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const trimStr = (v = '') => String(v).trim();

// Register
const registerUser = async (req, res) => {
  try {
    const { email, password, systemRole, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const exists = await User.findOne({ email: normalizeEmail(email) }).lean();
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizeEmail(email),
      password: hash,
      systemRole: systemRole || 'employee',
      firstName: trimStr(firstName) || 'New',
      lastName: trimStr(lastName) || 'Employee',
      employeeId: `EMP${Date.now()}`,
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      user: wrapUser(user),
      token: generateToken(user),
    });
  } catch (e) {
    console.error('registerUser error:', e);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({ token, user: wrapUser(user) });
  } catch (e) {
    console.error('loginUser error:', e);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: wrapUser(user) });
  } catch (e) {
    console.error('getProfile error:', e);
    return res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

// Update Profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { firstName, lastName, phone, address } = req.body;
    if (firstName !== undefined) user.firstName = trimStr(firstName);
    if (lastName !== undefined) user.lastName = trimStr(lastName);
    if (phone !== undefined) user.phone = trimStr(phone);
    if (address !== undefined) user.address = trimStr(address);

    const updated = await user.save();
    return res.json({
      message: 'Profile updated',
      user: wrapUser(updated),
    });
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Old password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, 10);
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
