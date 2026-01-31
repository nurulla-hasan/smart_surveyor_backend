"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../utils/auth.js");
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
class AuthService {
    static async register(data) {
        const userExists = await prisma_js_1.prisma.user.findUnique({ where: { email: data.email } });
        if (userExists) {
            throw new ApiError_js_1.default(400, 'User already exists with this email');
        }
        const hashedPassword = await (0, auth_js_1.hashPassword)(data.password);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                companyName: true,
                licenseNo: true,
                address: true,
                createdAt: true,
                updatedAt: true
            }
        });
        const accessToken = (0, auth_js_1.generateToken)(user);
        const refreshToken = (0, auth_js_1.generateRefreshToken)(user.id);
        return { accessToken, refreshToken };
    }
    static async login(email, passwordText) {
        const user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new ApiError_js_1.default(401, 'Invalid credentials');
        }
        const isMatch = await (0, auth_js_1.comparePassword)(passwordText, user.password);
        if (!isMatch) {
            throw new ApiError_js_1.default(401, 'Invalid credentials');
        }
        const accessToken = (0, auth_js_1.generateToken)(user);
        const refreshToken = (0, auth_js_1.generateRefreshToken)(user.id);
        return { accessToken, refreshToken };
    }
    static async refreshToken(token) {
        try {
            const decoded = (0, auth_js_1.verifyRefreshToken)(token);
            const user = await prisma_js_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    companyName: true,
                    licenseNo: true,
                    address: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (!user) {
                throw new ApiError_js_1.default(401, 'User not found');
            }
            const accessToken = (0, auth_js_1.generateToken)(user);
            return { accessToken };
        }
        catch (error) {
            throw new ApiError_js_1.default(401, 'Invalid refresh token');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map