import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getCalculations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const search = req.query.search as string | undefined;
  const userId = req.user.id;

  const skip = (page - 1) * pageSize;

  const where: any = { userId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { booking: { title: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [calculations, totalCount] = await Promise.all([
    prisma.calculation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { title: true, client: { select: { name: true } } } } },
      skip,
      take: pageSize
    }),
    prisma.calculation.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, {
    calculations,
    meta: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize: pageSize
    }
  }, 'Calculations fetched successfully'));
});

export const saveCalculation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { title, type, inputData, resultData, bookingId } = req.body;

  // Start a transaction to ensure atomicity
  const calculation = await prisma.$transaction(async (tx) => {
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

    // 3. Create the new calculation
    return await tx.calculation.create({
      data: {
        userId: req.user!.id,
        title,
        bookingId,
        type,
        inputData,
        resultData
      }
    });
  });

  res.status(201).json(new ApiResponse(201, calculation, 'Calculation saved successfully'));
});

export const deleteCalculation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const calculation = await prisma.calculation.findFirst({
    where: { id: req.params.id as string, userId: req.user.id }
  });

  if (!calculation) {
    throw new ApiError(404, 'Calculation not found');
  }

  await prisma.calculation.delete({
    where: { id: req.params.id as string }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Calculation deleted successfully'));
});
