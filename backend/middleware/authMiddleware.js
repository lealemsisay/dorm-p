const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};

const adminOnly = authorizeRoles('admin');
const staffOnly = authorizeRoles('staff');
const studentOnly = authorizeRoles('student');
const adminOrStaffOnly = authorizeRoles('admin', 'staff');

module.exports = {
  authenticate,
  authorizeRoles,
  adminOnly,
  staffOnly,
  studentOnly,
  adminOrStaffOnly,
};

