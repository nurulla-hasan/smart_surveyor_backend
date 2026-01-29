import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getBlockedDates = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const dates = await prisma.blockedDate.findMany({
    where: { userId: req.user.id },
    select: { id: true, date: true, reason: true }
  });

  const formattedDates = dates.map(d => ({
    id: d.id,
    date: d.date.toISOString().split('T')[0],
    reason: d.reason
  }));

  res.status(200).json(new ApiResponse(200, formattedDates, 'Blocked dates fetched successfully'));
});

export const toggleBlockedDate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { date, reason } = req.body;
  
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const existing = await prisma.blockedDate.findFirst({
    where: {
      userId: req.user.id,
      date: normalizedDate
    }
  });

  if (existing) {
    await prisma.blockedDate.delete({
      where: { id: existing.id }
    });
    return res.status(200).json(new ApiResponse(200, { action: 'unblocked', date: normalizedDate }, 'Date unblocked successfully'));
  }

  const blockedDate = await prisma.blockedDate.create({
    data: {
      userId: req.user.id,
      date: normalizedDate,
      reason
    }
  });

  res.status(201).json(new ApiResponse(201, { action: 'blocked', date: blockedDate }, 'Date blocked successfully'));
});
