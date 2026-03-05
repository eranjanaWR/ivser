/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid'
    });
  }
};

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    
    next();
  };
};

/**
 * Check if user's email is verified
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  
  next();
};

/**
 * Check if user's ID is verified
 */
const requireIDVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (!req.user.isIDVerified) {
    return res.status(403).json({
      success: false,
      message: 'ID verification required',
      code: 'ID_NOT_VERIFIED'
    });
  }
  
  next();
};

/**
 * Check if user's face is verified
 */
const requireFaceVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  if (!req.user.isFaceVerified) {
    return res.status(403).json({
      success: false,
      message: 'Face verification required',
      code: 'FACE_NOT_VERIFIED'
    });
  }
  
  next();
};

/**
 * Check if user is fully verified (email, ID, and face)
 */
const requireFullyVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  const verificationStatus = {
    email: req.user.isEmailVerified,
    id: req.user.isIDVerified,
    face: req.user.isFaceVerified
  };
  
  if (!req.user.isFullyVerified()) {
    const missing = [];
    if (!verificationStatus.email) missing.push('email');
    if (!verificationStatus.id) missing.push('ID');
    if (!verificationStatus.face) missing.push('face');
    
    return res.status(403).json({
      success: false,
      message: 'Full verification required',
      code: 'NOT_FULLY_VERIFIED',
      missingVerifications: missing,
      verificationStatus
    });
  }
  
  next();
};

/**
 * Optional auth - attaches user if token exists but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Token invalid but that's okay for optional auth
    next();
  }
};

module.exports = {
  protect,
  authorize,
  requireEmailVerified,
  requireIDVerified,
  requireFaceVerified,
  requireFullyVerified,
  optionalAuth
};
