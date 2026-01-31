import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
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
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            throw new ApiError(401, 'User belonging to this token no longer exists');
        }
        req.user = user;
        next();
    }
    catch (err) {
        const message = process.env.NODE_ENV === 'development'
            ? `Not authorized: ${err.message}`
            : 'Not authorized to access this route';
        throw new ApiError(401, message);
    }
});
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, `User role ${req.user?.role} is not authorized to access this route`);
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map