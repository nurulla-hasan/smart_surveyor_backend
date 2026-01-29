import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

interface DecodedToken {
  id: string;
  role: string;
}

// Protect routes
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    throw new ApiError(401, 'Not authorized to access this route');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        throw new ApiError(401, 'User belonging to this token no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Not authorized to access this route');
  }
});

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `User role ${req.user?.role} is not authorized to access this route`);
    }
    next();
  };
};
