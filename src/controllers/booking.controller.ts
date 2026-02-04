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
  const search = req.query.search as string | undefined;
  const clientId = req.query.clientId as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  
  // If user is a client, we should show bookings where they are the client
  const where: any = req.user.role === 'client' 
    ? { client: { accountId: req.user.id } }
    : { userId: req.user.id };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Client filter
  if (clientId) {
    where.clientId = clientId;
  }

  // Search logic
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { propertyAddress: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { phone: { contains: search, mode: 'insensitive' } } }
    ];
  }

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
      include: { 
        client: { select: { id: true, name: true, email: true, phone: true } },
        calculations: { orderBy: { createdAt: 'desc' }, take: 1 },
        savedMaps: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
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

  const where: any = req.user.role === 'client'
    ? { id: req.params.id as string, client: { accountId: req.user.id } }
    : { id: req.params.id as string, userId: req.user.id };

  const booking = await prisma.booking.findFirst({
    where,
    include: { 
      client: { select: { id: true, name: true, email: true, phone: true } },
      calculations: { orderBy: { createdAt: 'desc' } },
      savedMaps: { orderBy: { createdAt: 'desc' } }
    }
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
    clientId, clientName, clientPhone, amountReceived, amountDue, paymentNote,
    surveyorId // Added for client portal bookings
  } = req.body;

  const role = req.user.role;
  let targetUserId: string;
  let targetClientId: string;
  let finalStatus: BookingStatus;

  if (role === 'client') {
    // If client is booking, they should choose a surveyorId, otherwise fallback to the first surveyor
    let surveyor;
    if (surveyorId) {
      surveyor = await prisma.user.findFirst({
        where: { id: surveyorId, role: 'surveyor' }
      });
    } else {
      surveyor = await prisma.user.findFirst({
        where: { role: 'surveyor' }
      });
    }

    if (!surveyor) {
      throw new ApiError(404, 'No surveyor found to accept bookings');
    }

    targetUserId = surveyor.id;
    finalStatus = 'pending';

    // Find the client record for this user account and surveyor
    const clientRecord = await prisma.client.findFirst({
      where: { accountId: req.user.id, userId: targetUserId }
    });

    if (!clientRecord) {
      // If no client record exists, create one automatically
      const newClient = await prisma.client.create({
        data: {
          userId: targetUserId,
          accountId: req.user.id,
          name: (req.user as any).name,
          email: req.user.email,
          phone: (req.user as any).phone || 'N/A'
        }
      });
      targetClientId = newClient.id;
    } else {
      targetClientId = clientRecord.id;
    }
  } else {
    // Admin or Surveyor creating booking
    targetUserId = (role === 'admin' && surveyorId) ? surveyorId : req.user.id;
    finalStatus = (status as BookingStatus) || 'scheduled';

    if (clientId) {
      // If clientId is provided, verify it belongs to this surveyor
      const existingClient = await prisma.client.findFirst({
        where: { id: clientId, userId: targetUserId }
      });
      if (!existingClient) {
        throw new ApiError(404, 'Selected client not found for this surveyor');
      }
      targetClientId = existingClient.id;
    } else if (clientName) {
      // Fallback to finding/creating by name if clientId not provided
      let client = await prisma.client.findFirst({
        where: { userId: targetUserId, name: clientName }
      });
      
      if (!client) {
        client = await prisma.client.create({
          data: {
            userId: targetUserId,
            name: clientName,
            email: `${Date.now()}@temp.com`, // More unique temp email
            phone: clientPhone || 'N/A'
          }
        });
      }
      targetClientId = client.id;
    } else {
      throw new ApiError(400, 'Client ID or Client Name is required');
    }
  }

  // Normalize date to UTC midnight using robust YYYY-MM-DD parsing
  const dateStr = typeof bookingDate === 'string' ? bookingDate.split('T')[0] : bookingDate.toISOString().split('T')[0];
  const normalizedDate = new Date(`${dateStr}T00:00:00.000Z`);

  const isBlocked = await prisma.blockedDate.findFirst({
    where: {
      userId: targetUserId,
      date: normalizedDate
    }
  });

  if (isBlocked) {
    throw new ApiError(400, 'This date is blocked. Please select another date.');
  }

  const booking = await prisma.booking.create({
    data: {
      userId: targetUserId,
      clientId: targetClientId,
      title,
      description,
      bookingDate: normalizedDate,
      status: finalStatus,
      propertyAddress,
      amountReceived: parseFloat(amountReceived) || 0,
      amountDue: parseFloat(amountDue) || 0,
      paymentNote
    },
    include: { client: true }
  });

  // Create notification for the surveyor (only if the one creating it is NOT the surveyor themselves)
  if (req.user.id !== targetUserId) {
    try {
      const clientName = (req.user as any).name || 'A client';
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'NEW_BOOKING',
          title: 'New Booking Request',
          message: `${clientName} has booked a new survey.`,
          link: '/dashboard/bookings?filter=pending'
        }
      });
      console.log(`Notification created for surveyor ${targetUserId}`);
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
  }

  res.status(201).json(new ApiResponse(201, booking, 'Booking created successfully'));
});

export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const where: any = req.user.role === 'client'
    ? { id: req.params.id as string, client: { accountId: req.user.id } }
    : { id: req.params.id as string, userId: req.user.id };

  const booking = await prisma.booking.findFirst({
    where
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const data = { ...req.body };

  if (data.bookingDate) {
    const dateStr = typeof data.bookingDate === 'string' ? data.bookingDate.split('T')[0] : data.bookingDate.toISOString().split('T')[0];
    const newDate = new Date(`${dateStr}T00:00:00.000Z`);
    
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
    where: { id: req.params.id as string },
    data,
    include: { client: true, user: { select: { name: true } } }
  });

  // Create notification if status is updated
  if (data.status && data.status !== booking.status) {
    let title = 'Booking Update';
    let message = `Your booking status has been changed to "${data.status}".`;

    if (data.status === 'scheduled') {
      title = 'Booking Approved';
      message = `Your booking has been approved and scheduled for ${new Date(updatedBooking.bookingDate).toLocaleDateString()}.`;
    } else if (data.status === 'cancelled') {
      title = 'Booking Cancelled';
      message = `Your booking has been cancelled.`;
    }

    // Notify the client
    if (updatedBooking.client.accountId) {
      try {
        await prisma.notification.create({
          data: {
            userId: updatedBooking.client.accountId,
            type: 'STATUS_UPDATE',
            title,
            message,
            link: '/dashboard/bookings'
          }
        });
      } catch (notifError) {
        console.error('Error creating status update notification:', notifError);
      }
    }
  }

  // Create notification for payment update
  if ((data.amountReceived !== undefined && data.amountReceived !== booking.amountReceived) || 
      (data.amountDue !== undefined && data.amountDue !== booking.amountDue)) {
    if (updatedBooking.client.accountId) {
      try {
        await prisma.notification.create({
          data: {
            userId: updatedBooking.client.accountId,
            type: 'PAYMENT_UPDATE',
            title: 'Payment Updated',
            message: `Payment information for your booking "${updatedBooking.title}" has been updated. Due: TK ${updatedBooking.amountDue}`,
            link: '/dashboard/bookings'
          }
        });
      } catch (notifError) {
        console.error('Error creating payment update notification:', notifError);
      }
    }
  }

  res.status(200).json(new ApiResponse(200, updatedBooking, 'Booking updated successfully'));
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const where: any = req.user.role === 'client'
    ? { id: req.params.id as string, client: { accountId: req.user.id } }
    : { id: req.params.id as string, userId: req.user.id };

  const booking = await prisma.booking.findFirst({
    where
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  await prisma.booking.delete({
    where: { id: req.params.id as string }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Booking deleted successfully'));
});

export const getUpcomingBookings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const limit = parseInt(req.query.limit as string) || 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: any = req.user.role === 'client'
    ? { client: { accountId: req.user.id }, bookingDate: { gte: today }, status: { not: 'cancelled' as BookingStatus } }
    : { userId: req.user.id, bookingDate: { gte: today }, status: { not: 'cancelled' as BookingStatus } };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { bookingDate: 'asc' },
    take: limit,
    include: { client: { select: { name: true } } }
  });

  res.status(200).json(new ApiResponse(200, bookings, 'Upcoming bookings fetched successfully'));
});

export const getCalendarData = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const month = req.query.month ? parseInt(req.query.month as string) : new Date().getUTCMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getUTCFullYear();
  const userId = req.user.id;

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [blockedDates, bookings] = await Promise.all([
    prisma.blockedDate.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      },
      select: { date: true, reason: true }
    }),
    prisma.booking.findMany({
      where: {
        userId,
        bookingDate: { gte: startDate, lte: endDate },
        status: { not: 'cancelled' }
      },
      select: { bookingDate: true, title: true, status: true }
    })
  ]);

  const calendarData = {
    blockedDates: blockedDates.map(d => ({
      date: d.date.toISOString().split('T')[0],
      reason: d.reason
    })),
    bookedDates: bookings.map(b => ({
      date: b.bookingDate.toISOString().split('T')[0],
      title: b.title,
      status: b.status
    }))
  };

  res.status(200).json(new ApiResponse(200, calendarData, 'Calendar data fetched successfully'));
});
