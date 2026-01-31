import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
export const getBlockedDates = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const month = req.query.month ? parseInt(req.query.month) : undefined;
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const where = { userId: req.user.id };
    if (month !== undefined && year !== undefined) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        where.date = { gte: startDate, lte: endDate };
    }
    else if (year !== undefined) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        where.date = { gte: startDate, lte: endDate };
    }
    const dates = await prisma.blockedDate.findMany({
        where,
        select: { id: true, date: true, reason: true },
        orderBy: { date: 'asc' }
    });
    const formattedDates = dates.map(d => ({
        id: d.id,
        date: d.date.toISOString().split('T')[0],
        reason: d.reason
    }));
    res.status(200).json(new ApiResponse(200, formattedDates, 'Blocked dates fetched successfully'));
});
export const toggleBlockedDate = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const { date, reason } = req.body;
    // Normalize date to UTC midnight using robust YYYY-MM-DD parsing
    const dateStr = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
    const normalizedDate = new Date(`${dateStr}T00:00:00.000Z`);
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
    // Check if there are any active bookings on this date before blocking
    const bookingOnDate = await prisma.booking.findFirst({
        where: {
            userId: req.user.id,
            bookingDate: normalizedDate,
            status: { not: 'cancelled' }
        }
    });
    if (bookingOnDate) {
        throw new ApiError(400, 'Cannot block this date because it already has an active booking.');
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
//# sourceMappingURL=blockedDate.controller.js.map