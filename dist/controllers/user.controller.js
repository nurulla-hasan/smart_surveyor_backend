"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSurveyorProfile = exports.getSurveyors = exports.updateProfile = exports.getProfile = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
const cloudinary_js_1 = require("../utils/cloudinary.js");
exports.getProfile = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const user = await prisma_js_1.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        throw new ApiError_js_1.default(404, 'User not found');
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(new ApiResponse_js_1.default(200, userWithoutPassword, 'Profile fetched successfully'));
});
exports.updateProfile = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const fields = ['name', 'phone', 'companyName', 'licenseNo', 'address', 'experience', 'location', 'bio'];
    const data = {};
    fields.forEach(field => {
        if (req.body[field] !== undefined) {
            if (field === 'experience') {
                data[field] = parseInt(req.body[field]);
            }
            else {
                data[field] = req.body[field];
            }
        }
    });
    // Handle profile image upload
    if (req.file) {
        const cloudinaryResponse = await (0, cloudinary_js_1.uploadOnCloudinary)(req.file.path);
        if (cloudinaryResponse) {
            data.profileImage = cloudinaryResponse.secure_url;
        }
    }
    const user = await prisma_js_1.prisma.user.update({
        where: { id: req.user.id },
        data
    });
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(new ApiResponse_js_1.default(200, userWithoutPassword, 'Profile updated successfully'));
});
exports.getSurveyors = (0, asyncHandler_js_1.default)(async (req, res) => {
    const { location, sortBy, minExperience } = req.query;
    const where = { role: 'surveyor' };
    if (location) {
        where.location = { contains: location, mode: 'insensitive' };
    }
    if (minExperience) {
        where.experience = { gte: parseInt(minExperience) };
    }
    const orderBy = {};
    if (sortBy === 'rating') {
        orderBy.rating = 'desc';
    }
    else if (sortBy === 'experience') {
        orderBy.experience = 'desc';
    }
    else {
        orderBy.createdAt = 'desc';
    }
    const surveyors = await prisma_js_1.prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            licenseNo: true,
            experience: true,
            rating: true,
            location: true,
            profileImage: true,
            bio: true
        },
        orderBy
    });
    res.status(200).json(new ApiResponse_js_1.default(200, surveyors, 'Surveyors fetched successfully'));
});
exports.getSurveyorProfile = (0, asyncHandler_js_1.default)(async (req, res) => {
    const { id } = req.params;
    const surveyor = await prisma_js_1.prisma.user.findFirst({
        where: { id: id, role: 'surveyor' },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            licenseNo: true,
            address: true,
            experience: true,
            rating: true,
            totalReviews: true,
            location: true,
            bio: true,
            profileImage: true,
            createdAt: true,
            _count: {
                select: {
                    bookings: true,
                    reports: true
                }
            }
        }
    });
    if (!surveyor) {
        throw new ApiError_js_1.default(404, 'Surveyor not found');
    }
    res.status(200).json(new ApiResponse_js_1.default(200, surveyor, 'Surveyor profile fetched successfully'));
});
//# sourceMappingURL=user.controller.js.map