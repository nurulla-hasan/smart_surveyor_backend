import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
export const getProfile = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        throw new ApiError(404, 'User not found');
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(new ApiResponse(200, userWithoutPassword, 'Profile fetched successfully'));
});
export const updateProfile = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
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
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (cloudinaryResponse) {
            data.profileImage = cloudinaryResponse.secure_url;
        }
    }
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data
    });
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(new ApiResponse(200, userWithoutPassword, 'Profile updated successfully'));
});
export const getSurveyors = asyncHandler(async (req, res) => {
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
    const surveyors = await prisma.user.findMany({
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
    res.status(200).json(new ApiResponse(200, surveyors, 'Surveyors fetched successfully'));
});
export const getSurveyorProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const surveyor = await prisma.user.findFirst({
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
        throw new ApiError(404, 'Surveyor not found');
    }
    res.status(200).json(new ApiResponse(200, surveyor, 'Surveyor profile fetched successfully'));
});
//# sourceMappingURL=user.controller.js.map