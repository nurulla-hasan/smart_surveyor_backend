"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.refresh = exports.login = exports.register = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const auth_service_js_1 = require("../services/auth.service.js");
const sendTokenResponse = (data, statusCode, res) => {
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };
    res
        .status(statusCode)
        .cookie('refreshToken', data.refreshToken, cookieOptions)
        .json(new ApiResponse_js_1.default(statusCode, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
    }, 'Authentication successful'));
};
exports.register = (0, asyncHandler_js_1.default)(async (req, res) => {
    const result = await auth_service_js_1.AuthService.register(req.body);
    sendTokenResponse(result, 201, res);
});
exports.login = (0, asyncHandler_js_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError_js_1.default(400, 'Please provide an email and password');
    }
    const result = await auth_service_js_1.AuthService.login(email, password);
    sendTokenResponse(result, 200, res);
});
exports.refresh = (0, asyncHandler_js_1.default)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
        throw new ApiError_js_1.default(401, 'Refresh token is required');
    }
    const result = await auth_service_js_1.AuthService.refreshToken(refreshToken);
    res.status(200).json(new ApiResponse_js_1.default(200, result, 'Token refreshed successfully'));
});
exports.getMe = (0, asyncHandler_js_1.default)(async (req, res) => {
    // @ts-ignore - req.user is added by protect middleware
    const user = await prisma_js_1.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        throw new ApiError_js_1.default(404, 'User not found');
    }
    const { password, resetPasswordToken, resetPasswordExpire, ...userProfile } = user;
    res.status(200).json(new ApiResponse_js_1.default(200, userProfile, 'User profile fetched successfully'));
});
exports.logout = (0, asyncHandler_js_1.default)(async (_req, res) => {
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'User logged out successfully'));
});
//# sourceMappingURL=auth.controller.js.map