const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name email role');
    if (!user) return res.status(401).json({ message: 'Not authorized' });
    req.user = user; // { _id, name, email, role }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

module.exports = { protect };
