"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyStats = exports.getStats = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getStats = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const userId = req.user.id;
    const [totalBookings, activeClients, reportsGenerated, completedBookings, pendingRequests, recentActivities, bookings] = await Promise.all([
        prisma_js_1.prisma.booking.count({ where: { userId } }),
        prisma_js_1.prisma.client.count({ where: { userId } }),
        prisma_js_1.prisma.report.count({ where: { userId } }),
        prisma_js_1.prisma.booking.count({ where: { userId, status: 'completed' } }),
        prisma_js_1.prisma.booking.findMany({
            where: { userId, status: 'pending' },
            take: 5,
            include: { client: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma_js_1.prisma.booking.findMany({
            where: { userId },
            take: 5,
            include: { client: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma_js_1.prisma.booking.findMany({
            where: { userId },
            select: { amountReceived: true, amountDue: true }
        })
    ]);
    const totalIncome = bookings.reduce((sum, b) => sum + (b.amountReceived || 0), 0);
    const totalDue = bookings.reduce((sum, b) => sum + (b.amountDue || 0), 0);
    res.status(200).json(new ApiResponse_js_1.default(200, {
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
exports.getMonthlyStats = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const userId = req.user.id;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    const bookings = await prisma_js_1.prisma.booking.findMany({
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
    res.status(200).json(new ApiResponse_js_1.default(200, data, 'Monthly stats fetched successfully'));
});
//# sourceMappingURL=dashboard.controller.js.map