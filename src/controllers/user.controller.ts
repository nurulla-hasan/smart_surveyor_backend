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
