const jwt = require('jsonwebtoken');
const UnionUser = require('../models/UnionUser.js');

// Verify token and set req.user
const authUnion = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is either manager or staff
    const user = await UnionUser.findById(decoded.id);
    if (!user || !['manager', 'staff'].includes(user.role)) {
      throw new Error('Union member access only');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message || 'Authentication failed' });
  }
};

// Manager-only access
const managerOnly = (req, res, next) => {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ message: 'Manager access required' });
  }
  next();
};

// Staff-only access
const staffOnly = (req, res, next) => {
  if (req.user?.role !== 'staff') {
    return res.status(403).json({ message: 'Staff access required' });
  }
  next();
};

module.exports = { authUnion, managerOnly, staffOnly };
