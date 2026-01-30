import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');
  
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (!user) throw new ApiError(404, 'User not found');
  
  const { password, ...userWithoutPassword } = user;
  res.status(200).json(new ApiResponse(200, userWithoutPassword, 'Profile fetched successfully'));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const fields = ['name', 'phone', 'companyName', 'licenseNo', 'address'];
  const data: any = {};
  
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  });

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
