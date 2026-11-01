const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');

// Protect routes: verify Bearer JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Attach decoded user payload to request
    req.user = decoded; // { id, role, email, name, department }
    
    // Also try to look up user from DB if DB is active
    try {
      const dbUser = await User.findById(decoded.id).select('-password');
      if (dbUser) {
        req.user = dbUser;
      }
    } catch (_) {}

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token'
    });
  }
};

// Restrict access to specified roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'unknown'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
