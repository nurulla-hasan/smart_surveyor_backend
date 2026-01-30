import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getMaps = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const skip = (page - 1) * pageSize;

  const [maps, totalCount] = await Promise.all([
    prisma.savedMap.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.savedMap.count({ where: { userId: req.user.id } })
  ]);

  res.status(200).json(new ApiResponse(200, {
    maps,
    meta: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize: pageSize
    }
  }, 'Maps fetched successfully'));
});

export const saveMap = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { name, data, fileUrl, bookingId } = req.body;

  // Basic validation for MongoDB ObjectID if bookingId is provided
  if (bookingId && !/^[0-9a-fA-F]{24}$/.test(bookingId)) {
    throw new ApiError(400, 'Invalid Booking ID format');
  }

  const map = await prisma.savedMap.create({
    data: {
      userId: req.user.id,
      bookingId: bookingId || null,
      name,
      data,
      fileUrl
    }
  });

  res.status(201).json(new ApiResponse(201, map, 'Map saved successfully'));
});

export const getClientSharedMaps = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const skip = (page - 1) * pageSize;

  const where = {
    booking: {
      client: {
        accountId: req.user.id
      }
    }
  };

  // Find all maps linked to bookings where the current user is the client
  const [maps, totalCount] = await Promise.all([
    prisma.savedMap.findMany({
      where,
      include: {
        booking: {
          select: {
            title: true,
            bookingDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.savedMap.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, {
    maps,
    meta: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize: pageSize
    }
  }, 'Shared maps fetched successfully'));
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
