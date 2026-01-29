import BlockedDate from '../models/BlockedDate.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getBlockedDates = asyncHandler(async (req, res) => {
  const dates = await BlockedDate.find({ userId: req.user.id })
    .select('date reason');

  const formattedDates = dates.map(d => ({
    id: d._id,
    date: d.date.toISOString().split('T')[0],
    reason: d.reason
  }));

  res.status(200).json(new ApiResponse(200, formattedDates, 'Blocked dates fetched successfully'));
});

export const toggleBlockedDate = asyncHandler(async (req, res) => {
  const { date, reason } = req.body;
  
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const existing = await BlockedDate.findOne({
    userId: req.user.id,
    date: normalizedDate
  });

  if (existing) {
    await existing.deleteOne();
    return res.status(200).json(new ApiResponse(200, { action: 'unblocked', date: normalizedDate }, 'Date unblocked successfully'));
  }

  const blockedDate = await BlockedDate.create({
    userId: req.user.id,
    date: normalizedDate,
    reason
  });

  res.status(201).json(new ApiResponse(201, { action: 'blocked', date: blockedDate }, 'Date blocked successfully'));
});
