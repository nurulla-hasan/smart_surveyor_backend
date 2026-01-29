import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const userId = req.user.id;

  const [
    totalBookings, 
    activeClients, 
    reportsGenerated, 
    completedBookings,
    pendingRequests,
    recentActivities,
    bookings
  ] = await Promise.all([
    prisma.booking.count({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
    prisma.report.count({ where: { userId } }),
    prisma.booking.count({ where: { userId, status: 'completed' } }),
    prisma.booking.findMany({
      where: { userId, status: 'pending' },
      take: 5,
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.booking.findMany({
      where: { userId },
      take: 5,
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.booking.findMany({ 
      where: { userId },
      select: { amountReceived: true, amountDue: true } 
    })
  ]);

  const totalIncome = bookings.reduce((sum, b) => sum + (b.amountReceived || 0), 0);
  const totalDue = bookings.reduce((sum, b) => sum + (b.amountDue || 0), 0);

  res.status(200).json(new ApiResponse(200, {
    totalBookings,
    activeClients,
    reportsGenerated,
    completedBookings,
    totalIncome,
    totalDue,
    pendingRequests,
    recentActivities
  }, 'Dashboard stats fetched successfully'));
});

export const getMonthlyStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const userId = req.user.id;
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      bookingDate: { gte: startDate, lte: endDate }
    },
    select: { bookingDate: true }
  });

  const monthlyStats = Array(12).fill(0);
  bookings.forEach(booking => {
    const month = new Date(booking.bookingDate).getMonth();
    monthlyStats[month]++;
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = monthNames.map((name, index) => ({
    name,
    total: monthlyStats[index]
  }));

  res.status(200).json(new ApiResponse(200, data, 'Monthly stats fetched successfully'));
});
