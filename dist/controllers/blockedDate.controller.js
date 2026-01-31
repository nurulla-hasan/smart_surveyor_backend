"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleBlockedDate = exports.getBlockedDates = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getBlockedDates = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
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
    const dates = await prisma_js_1.prisma.blockedDate.findMany({
        where,
        select: { id: true, date: true, reason: true },
        orderBy: { date: 'asc' }
    });
    const formattedDates = dates.map(d => ({
        id: d.id,
        date: d.date.toISOString().split('T')[0],
        reason: d.reason
    }));
    res.status(200).json(new ApiResponse_js_1.default(200, formattedDates, 'Blocked dates fetched successfully'));
});
exports.toggleBlockedDate = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const { date, reason } = req.body;
    // Normalize date to UTC midnight using robust YYYY-MM-DD parsing
    const dateStr = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
    const normalizedDate = new Date(`${dateStr}T00:00:00.000Z`);
    const existing = await prisma_js_1.prisma.blockedDate.findFirst({
        where: {
            userId: req.user.id,
            date: normalizedDate
        }
    });
    if (existing) {
        await prisma_js_1.prisma.blockedDate.delete({
            where: { id: existing.id }
        });
        return res.status(200).json(new ApiResponse_js_1.default(200, { action: 'unblocked', date: normalizedDate }, 'Date unblocked successfully'));
    }
    // Check if there are any active bookings on this date before blocking
    const bookingOnDate = await prisma_js_1.prisma.booking.findFirst({
        where: {
            userId: req.user.id,
            bookingDate: normalizedDate,
            status: { not: 'cancelled' }
        }
    });
    if (bookingOnDate) {
        throw new ApiError_js_1.default(400, 'Cannot block this date because it already has an active booking.');
    }
    const blockedDate = await prisma_js_1.prisma.blockedDate.create({
        data: {
            userId: req.user.id,
            date: normalizedDate,
            reason
        }
    });
    return res.status(201).json(new ApiResponse_js_1.default(201, { action: 'blocked', date: blockedDate }, 'Date blocked successfully'));
});
//# sourceMappingURL=blockedDate.controller.js.map