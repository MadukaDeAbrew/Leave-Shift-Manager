const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Shared helpers
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const trimStr = (v = '') => String(v).trim();

// --- POST /api/auth/register ---
const registerUser = async (req, res) => {
  try {
    const name = trimStr(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    // added basic validation to keep server-side checks 
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Password strength: min 8, upper, lower, number, special charater
    const strongPwd =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(password);
    if (!strongPwd) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include upper, lower, number, and special character.',
      });
    }

    // Unique email check
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // 1.4 Hash password 
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ name, email, password: hash });

    // For signup we can choose not to auto-login; here we return token for convenience
    return res.status(201).json({
      message: 'User registered successfully.',
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (e) {
    // Handle duplicate-key race (Mongo code 11000)
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

    // IMPORTANT: select('+password') because password has select:false in schema
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
      },
    });
  } catch (e) {
    console.error('loginUser error:', e);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// --- GET /api/auth/profile (protected) ---
const getProfile = async (req, res) => {
  try {
    // req.user.id is set by auth middleware after verifying JWT
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Never include password (schema select:false already prevents it)
    return res.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      pronouns: user.pronouns,
      secondaryEmail: user.secondaryEmail,
      address: user.address,
      role: user.role,
    });
  } catch (e) {
    console.error('getProfile error:', e);
    return res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

// --- PUT /api/auth/profile (protected) ---
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only update provided fields; normalize email
    const {
      name,
      email,
      phone,
      pronouns,
      secondaryEmail,
      address,
    } = req.body;

    if (name !== undefined) user.name = trimStr(name) || user.name;
    if (email !== undefined) user.email = normalizeEmail(email) || user.email;
    if (phone !== undefined) user.phone = trimStr(phone);
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (secondaryEmail !== undefined) user.secondaryEmail = normalizeEmail(secondaryEmail);
    if (address !== undefined) user.address = trimStr(address);

    try {
      const updated = await user.save();
      // Issue a fresh token (optional; keeps client “logged in” with current profile)
      return res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        pronouns: updated.pronouns,
        secondaryEmail: updated.secondaryEmail,
        address: updated.address,
        role: updated.role,
        token: generateToken(updated.id),
      });
    } catch (saveErr) {
      // Handle email uniqueness collision
      if (saveErr?.code === 11000 && saveErr?.keyPattern?.email) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      throw saveErr;
    }
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
};


module.exports = { registerUser, loginUser, updateUserProfile, getProfile };
