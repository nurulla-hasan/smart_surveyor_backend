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
const auth_js_1 = require("../utils/auth.js");
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
    // Parse JSON data from the "data" field in FormData if it exists
    let bodyData = req.body;
    if (req.body.data) {
        try {
            bodyData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
        }
        catch (error) {
            console.error('JSON Parse Error in updateProfile:', error);
            // Fallback to req.body if parsing fails
        }
    }
    console.log('Update Profile Processed Body:', bodyData);
    console.log('Update Profile File:', req.file);
    const fields = ['name', 'phone', 'companyName', 'licenseNo', 'address', 'experience', 'location', 'bio'];
    const data = {};
    fields.forEach(field => {
        if (bodyData[field] !== undefined) {
            if (field === 'experience') {
                const exp = parseInt(bodyData[field]);
                if (!isNaN(exp))
                    data[field] = exp;
            }
            else {
                data[field] = bodyData[field];
            }
        }
    });
    // Handle profile image upload
    if (req.file) {
        try {
            const cloudinaryResponse = await (0, cloudinary_js_1.uploadOnCloudinary)(req.file.path);
            if (cloudinaryResponse) {
                data.profileImage = cloudinaryResponse.secure_url;
            }
        }
        catch (error) {
            console.error('Cloudinary upload error:', error);
        }
    }
    if (Object.keys(data).length === 0) {
        return res.status(200).json(new ApiResponse_js_1.default(200, req.user, 'No changes to update'));
    }
    const user = await prisma_js_1.prisma.user.update({
        where: { id: req.user.id },
        data
    });
    const { password, ...userWithoutPassword } = user;
    // Generate new token with updated data
    const accessToken = (0, auth_js_1.generateToken)(userWithoutPassword);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        user: userWithoutPassword,
        accessToken
    }, 'Profile updated successfully'));
});
exports.getSurveyors = (0, asyncHandler_js_1.default)(async (req, res) => {
    const { location, sortBy, minExperience, search, page, limit } = req.query;
    const where = { role: 'surveyor' };
    if (location) {
        where.location = { contains: location, mode: 'insensitive' };
    }
    if (minExperience) {
        where.experience = { gte: parseInt(minExperience) };
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } }
        ];
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
    const pageNumber = page ? parseInt(page) : 1;
    // Support both limit and limit for consistency across the app
    const limitNumber = (limit) ? parseInt((limit)) : 10;
    const skip = (pageNumber - 1) * limitNumber;
    const [surveyors, total] = await Promise.all([
        prisma_js_1.prisma.user.findMany({
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
            orderBy,
            skip,
            take: limitNumber,
        }),
        prisma_js_1.prisma.user.count({ where })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        surveyors,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber)
        }
    }, 'Surveyors fetched successfully'));
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