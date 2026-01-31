"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
// Protect routes
exports.protect = (0, asyncHandler_js_1.default)(async (req, _res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        throw new ApiError_js_1.default(401, 'Not authorized to access this route');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            throw new ApiError_js_1.default(401, 'User belonging to this token no longer exists');
        }
        req.user = user;
        next();
    }
    catch (err) {
        const message = process.env.NODE_ENV === 'development'
            ? `Not authorized: ${err.message}`
            : 'Not authorized to access this route';
        throw new ApiError_js_1.default(401, message);
    }
});
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError_js_1.default(403, `User role ${req.user?.role} is not authorized to access this route`);
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map