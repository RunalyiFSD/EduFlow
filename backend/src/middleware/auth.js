const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next(new ApiError(401, 'Authentication token is missing.'));

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return next(new ApiError(401, 'Invalid or expired authentication token.'));
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new ApiError(401, 'User account not found.'));
    if (user.isSuspended) return next(new ApiError(403, 'This account has been suspended.'));
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(500, 'Error verifying user session.'));
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Unauthorized access for your role.'));
  }
  next();
};

module.exports = { protect, requireRole };
