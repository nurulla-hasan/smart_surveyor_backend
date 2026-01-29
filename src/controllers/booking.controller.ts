import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { BookingStatus } from '@prisma/client';

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const filter = (req.query.filter as string) || 'all';
  const dateStr = req.query.date as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const userId = req.user.id;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: any = { userId };

  // Date filter logic
  if (dateStr) {
    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);
    
    where.bookingDate = { gte: startDate, lte: endDate };
  }

  // Status filter logic
  if (filter === 'upcoming') {
    if (!dateStr) where.bookingDate = { gte: today };
    where.status = { not: 'pending' as BookingStatus };
  } else if (filter === 'past') {
    if (!dateStr) where.bookingDate = { lt: today };
    where.status = { not: 'pending' as BookingStatus };
  } else if (filter === 'pending') {
    where.status = 'pending' as BookingStatus;
  }

  const skip = (page - 1) * pageSize;

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { client: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { bookingDate: filter === 'past' ? 'desc' : 'asc' },
      skip,
      take: pageSize
    }),
    prisma.booking.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, {
    bookings,
    meta: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize: pageSize
    }
  }, 'Bookings fetched successfully'));
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { client: true }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  res.status(200).json(new ApiResponse(200, booking, 'Booking details fetched successfully'));
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const { 
    title, description, bookingDate, status, propertyAddress, 
    clientName, clientPhone, amountReceived, amountDue, paymentNote 
  } = req.body;

  const normalizedDate = new Date(bookingDate);
  normalizedDate.setHours(0, 0, 0, 0);

  const isBlocked = await prisma.blockedDate.findFirst({
    where: {
      userId: req.user.id,
      date: normalizedDate
    }
  });

  if (isBlocked) {
    throw new ApiError(400, 'This date is blocked. Please select another date.');
  }

  let client = await prisma.client.findFirst({
    where: { userId: req.user.id, name: clientName }
  });
  
  if (!client) {
    client = await prisma.client.create({
      data: {
        userId: req.user.id,
        name: clientName,
        email: 'temp@example.com',
        phone: clientPhone || 'N/A'
      }
    });
  }

  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id,
      clientId: client.id,
      title,
      description,
      bookingDate: normalizedDate,
      status: (status as BookingStatus) || 'scheduled',
      propertyAddress,
      amountReceived: parseFloat(amountReceived) || 0,
      amountDue: parseFloat(amountDue) || 0,
      paymentNote
    },
    include: { client: true }
  });

  res.status(201).json(new ApiResponse(201, booking, 'Booking created successfully'));
});

export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const data = { ...req.body };

  if (data.bookingDate) {
    const newDate = new Date(data.bookingDate);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate.getTime() !== new Date(booking.bookingDate).getTime()) {
        const isBlocked = await prisma.blockedDate.findFirst({
            where: {
                userId: req.user.id,
                date: newDate
            }
        });
        
        if (isBlocked) {
            throw new ApiError(400, 'This date is blocked. Please select another date.');
        }
        data.bookingDate = newDate;
    }
  }

  if (data.amountReceived !== undefined) data.amountReceived = parseFloat(data.amountReceived);
  if (data.amountDue !== undefined) data.amountDue = parseFloat(data.amountDue);
  if (data.status) data.status = data.status as BookingStatus;

  const updatedBooking = await prisma.booking.update({
    where: { id: req.params.id },
    data,
    include: { client: true }
  });

  res.status(200).json(new ApiResponse(200, updatedBooking, 'Booking updated successfully'));
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  await prisma.booking.delete({
    where: { id: req.params.id }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Booking deleted successfully'));
});

export const getUpcomingBookings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const limit = parseInt(req.query.limit as string) || 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      userId: req.user.id,
      bookingDate: { gte: today },
      status: { not: 'cancelled' as BookingStatus }
    },
    orderBy: { bookingDate: 'asc' },
    take: limit,
    include: { client: { select: { name: true } } }
  });

  res.status(200).json(new ApiResponse(200, bookings, 'Upcoming bookings fetched successfully'));
});
