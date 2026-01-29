import Booking from '../models/Booking.js';
import Client from '../models/Client.js';
import BlockedDate from '../models/BlockedDate.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getBookings = asyncHandler(async (req, res) => {
  const { filter = 'all', page = 1, pageSize = 10 } = req.query;
  const userId = req.user.id;
  
  let query = { userId };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === 'upcoming') {
    query = { ...query, bookingDate: { $gte: today }, status: { $ne: 'pending' } };
  } else if (filter === 'past') {
    query = { ...query, bookingDate: { $lt: today }, status: { $ne: 'pending' } };
  } else if (filter === 'pending') {
    query = { ...query, status: 'pending' };
  }

  const skip = (parseInt(page) - 1) * parseInt(pageSize);

  const [bookings, totalCount] = await Promise.all([
    Booking.find(query)
      .sort({ bookingDate: filter === 'past' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(pageSize)),
    Booking.countDocuments(query)
  ]);

  res.status(200).json(new ApiResponse(200, {
    bookings,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    currentPage: parseInt(page)
  }, 'Bookings fetched successfully'));
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  res.status(200).json(new ApiResponse(200, booking, 'Booking details fetched successfully'));
});

export const createBooking = asyncHandler(async (req, res) => {
  const { 
    title, description, bookingDate, status, propertyAddress, 
    clientName, clientPhone, amountReceived, amountDue, paymentNote 
  } = req.body;

  const normalizedDate = new Date(bookingDate);
  normalizedDate.setHours(0, 0, 0, 0);

  const isBlocked = await BlockedDate.findOne({
    userId: req.user.id,
    date: normalizedDate
  });

  if (isBlocked) {
    throw new ApiError(400, 'This date is blocked. Please select another date.');
  }

  let client = await Client.findOne({ userId: req.user.id, name: clientName });
  
  if (!client) {
    client = await Client.create({
      userId: req.user.id,
      name: clientName,
      email: 'temp@example.com',
      phone: clientPhone || 'N/A'
    });
  }

  const booking = await Booking.create({
    userId: req.user.id,
    clientId: client._id,
    title,
    description,
    bookingDate: normalizedDate,
    status: status || 'scheduled',
    propertyAddress,
    amountReceived: amountReceived || 0,
    amountDue: amountDue || 0,
    paymentNote
  });

  res.status(201).json(new ApiResponse(201, booking, 'Booking created successfully'));
});

export const updateBooking = asyncHandler(async (req, res) => {
  let booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (req.body.bookingDate) {
    const newDate = new Date(req.body.bookingDate);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate.getTime() !== new Date(booking.bookingDate).getTime()) {
        const isBlocked = await BlockedDate.findOne({
            userId: req.user.id,
            date: newDate
        });
        
        if (isBlocked) {
            throw new ApiError(400, 'This date is blocked. Please select another date.');
        }
        req.body.bookingDate = newDate;
    }
  }

  booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(new ApiResponse(200, booking, 'Booking updated successfully'));
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  await booking.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, 'Booking deleted successfully'));
});

export const getUpcomingBookings = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await Booking.find({
    userId: req.user.id,
    bookingDate: { $gte: today },
    status: { $ne: 'cancelled' }
  })
  .sort({ bookingDate: 1 })
  .limit(limit);

  res.status(200).json(new ApiResponse(200, bookings, 'Upcoming bookings fetched successfully'));
});
