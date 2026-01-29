import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getCalculations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const calculations = await prisma.calculation.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { booking: { select: { title: true } } }
  });

  res.status(200).json(new ApiResponse(200, calculations, 'Calculations fetched successfully'));
});

export const saveCalculation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { type, inputData, resultData, bookingId } = req.body;

  const calculation = await prisma.calculation.create({
    data: {
      userId: req.user.id,
      bookingId,
      type,
      inputData,
      resultData
    }
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
