import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    throw new ApiError(401, 'Not authorized to access this route');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
        throw new ApiError(401, 'User belonging to this token no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Not authorized to access this route');
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};
