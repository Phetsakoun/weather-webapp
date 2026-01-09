const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Require JWT_SECRET to be set; fail fast if missing
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Middleware to verify viewer role or higher (viewer can read and export)
const verifyViewer = (req, res, next) => {
  if (req.user && ['admin', 'viewer'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Viewer access required' });
  }
};

// Middleware to verify admin role for write operations (create, update, delete)
const verifyAdminForWrite = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required for write operations' });
  }
};

// Middleware to verify user owns resource or is admin
const verifyOwnerOrAdmin = (req, res, next) => {
  const userId = req.params.userId || req.body.userId;

  if (req.user && (req.user.id == userId || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyViewer,
  verifyAdminForWrite,
  verifyOwnerOrAdmin,
};
