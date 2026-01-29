import Booking from '../models/Booking.js';
import Client from '../models/Client.js';
import Report from '../models/Report.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [totalBookings, activeClients, reportsGenerated, bookings] = await Promise.all([
    Booking.countDocuments({ userId }),
    Client.countDocuments({ userId }),
    Report.countDocuments({ userId }),
    Booking.find({ userId }).select('amountReceived amountDue')
  ]);

  const totalIncome = bookings.reduce((sum, b) => sum + (b.amountReceived || 0), 0);
  const totalDue = bookings.reduce((sum, b) => sum + (b.amountDue || 0), 0);

  res.status(200).json(new ApiResponse(200, {
    totalBookings,
    activeClients,
    reportsGenerated,
    totalIncome,
    totalDue
  }, 'Dashboard stats fetched successfully'));
});

export const getMonthlyStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);

  const bookings = await Booking.find({
    userId,
    bookingDate: { $gte: startDate, $lte: endDate }
  }).select('bookingDate');

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
