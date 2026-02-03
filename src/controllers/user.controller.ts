import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');
  
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (!user) throw new ApiError(404, 'User not found');
  
  const { password, ...userWithoutPassword } = user;
  res.status(200).json(new ApiResponse(200, userWithoutPassword, 'Profile fetched successfully'));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  // Parse JSON data from the "data" field in FormData if it exists
  let bodyData = req.body;
  if (req.body.data) {
    try {
      bodyData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } catch (error) {
      console.error('JSON Parse Error in updateProfile:', error);
      // Fallback to req.body if parsing fails
    }
  }

  console.log('Update Profile Processed Body:', bodyData);
  console.log('Update Profile File:', req.file);

  const fields = ['name', 'phone', 'companyName', 'licenseNo', 'address', 'experience', 'location', 'bio'];
  const data: any = {};
  
  fields.forEach(field => {
    if (bodyData[field] !== undefined) {
      if (field === 'experience') {
        const exp = parseInt(bodyData[field]);
        if (!isNaN(exp)) data[field] = exp;
      } else {
        data[field] = bodyData[field];
      }
    }
  });

  // Handle profile image upload
  if (req.file) {
    try {
      const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
      if (cloudinaryResponse) {
        data.profileImage = cloudinaryResponse.secure_url;
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
    }
  }

  if (Object.keys(data).length === 0) {
    return res.status(200).json(new ApiResponse(200, req.user, 'No changes to update'));
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data
  });

  const { password, ...userWithoutPassword } = user;
  res.status(200).json(new ApiResponse(200, userWithoutPassword, 'Profile updated successfully'));
});

export const getSurveyors = asyncHandler(async (req: Request, res: Response) => {
  const { location, sortBy, minExperience } = req.query;
  
  const where: any = { role: 'surveyor' };
  
  if (location) {
    where.location = { contains: location as string, mode: 'insensitive' };
  }
  
  if (minExperience) {
    where.experience = { gte: parseInt(minExperience as string) };
  }

  const orderBy: any = {};
  if (sortBy === 'rating') {
    orderBy.rating = 'desc';
  } else if (sortBy === 'experience') {
    orderBy.experience = 'desc';
  } else {
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

export const getSurveyorProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const surveyor = await prisma.user.findFirst({
    where: { id: id as string, role: 'surveyor' },
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
