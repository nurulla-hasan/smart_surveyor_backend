import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getMaps = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt((req.query.limit || req.query.limit) as string) || 10;
  const search = req.query.search as string || '';
  const skip = (page - 1) * limit;

  const where: any = { userId: req.user.id };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { booking: { title: { contains: search, mode: 'insensitive' } } },
      { booking: { propertyAddress: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [maps, totalCount] = await Promise.all([
    prisma.savedMap.findMany({
      where,
      include: {
        booking: {
          select: {
            title: true,
            propertyAddress: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.savedMap.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, {
    maps,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }, 'Maps fetched successfully'));
});

export const saveMap = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { name, data, fileUrl, bookingId, area, perimeter } = req.body;

  // Basic validation for MongoDB ObjectID if bookingId is provided
  if (bookingId && !/^[0-9a-fA-F]{24}$/.test(bookingId)) {
    throw new ApiError(400, 'Invalid Booking ID format');
  }

  // Start a transaction to ensure atomicity
  const map = await prisma.$transaction(async (tx) => {
    // If bookingId is provided, delete existing calculations and maps for this booking
    if (bookingId) {
      // 1. Delete existing calculations for this booking
      await tx.calculation.deleteMany({
        where: { bookingId, userId: req.user!.id }
      });

      // 2. Delete existing maps for this booking
      await tx.savedMap.deleteMany({
        where: { bookingId, userId: req.user!.id }
      });
    }

    // 3. Create the new map
    return await tx.savedMap.create({
      data: {
        userId: req.user!.id,
        bookingId: bookingId || null,
        name,
        data,
        area: area ? parseFloat(area) : null,
        perimeter: perimeter ? parseFloat(perimeter) : null,
        fileUrl
      }
    });
  });

  res.status(201).json(new ApiResponse(201, map, 'Map saved successfully'));
});

export const getClientSharedMaps = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt((req.query.limit || req.query.limit) as string) || 10;
  const skip = (page - 1) * limit;

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
      take: limit
    }),
    prisma.savedMap.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, {
    maps,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
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
