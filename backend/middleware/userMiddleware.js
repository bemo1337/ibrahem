const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

// Strict authentication for users (engineers)
const userAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.role !== 'engineer') {
      return res.status(403).json({ message: 'Access denied - engineers only' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const userProtect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify this is a User (engineer)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || req.user.role !== 'engineer') {
        return res.status(401).json({ 
          message: 'Not authorized as an engineer' 
        });
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    res.status(401).json({ 
      message: 'Not authorized, no token' 
    });
  }
};

module.exports = { userAuth, userProtect };