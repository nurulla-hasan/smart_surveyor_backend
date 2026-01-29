import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getMaps = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const maps = await prisma.savedMap.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json(new ApiResponse(200, maps, 'Maps fetched successfully'));
});

export const saveMap = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { name, data, fileUrl } = req.body;

  const map = await prisma.savedMap.create({
    data: {
      userId: req.user.id,
      name,
      data,
      fileUrl
    }
  });

  res.status(201).json(new ApiResponse(201, map, 'Map saved successfully'));
});

export const deleteMap = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const map = await prisma.savedMap.findFirst({
    where: { id: req.params.id as string, userId: req.user.id }
  });

  if (!map) {
    throw new ApiError(404, 'Map not found');
  }

  await prisma.savedMap.delete({
    where: { id: req.params.id as string }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Map deleted successfully'));
});
