"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarData = exports.getUpcomingBookings = exports.deleteBooking = exports.updateBooking = exports.createBooking = exports.getBooking = exports.getBookings = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getBookings = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const filter = req.query.filter || 'all';
    const dateStr = req.query.date;
    const search = req.query.search;
    const clientId = req.query.clientId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt((req.query.limit || req.query.limit)) || 10;
    // If user is a client, we should show bookings where they are the client
    const where = req.user.role === 'client'
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
        if (!dateStr)
            where.bookingDate = { gte: today };
        where.status = { not: 'pending' };
    }
    else if (filter === 'past') {
        if (!dateStr)
            where.bookingDate = { lt: today };
        where.status = { not: 'pending' };
    }
    else if (filter === 'pending') {
        where.status = 'pending';
    }
    const skip = (page - 1) * limit;
    const [bookings, totalCount] = await Promise.all([
        prisma_js_1.prisma.booking.findMany({
            where,
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                calculations: { orderBy: { createdAt: 'desc' }, take: 1 },
                savedMaps: { orderBy: { createdAt: 'desc' }, take: 1 }
            },
            orderBy: { bookingDate: filter === 'past' ? 'desc' : 'asc' },
            skip,
            take: limit
        }),
        prisma_js_1.prisma.booking.count({ where })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        bookings,
        meta: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 'Bookings fetched successfully'));
});
exports.getBooking = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const where = req.user.role === 'client'
        ? { id: req.params.id, client: { accountId: req.user.id } }
        : { id: req.params.id, userId: req.user.id };
    const booking = await prisma_js_1.prisma.booking.findFirst({
        where,
        include: {
            client: { select: { id: true, name: true, email: true, phone: true } },
            calculations: { orderBy: { createdAt: 'desc' } },
            savedMaps: { orderBy: { createdAt: 'desc' } }
        }
    });
    if (!booking) {
        throw new ApiError_js_1.default(404, 'Booking not found');
    }
    res.status(200).json(new ApiResponse_js_1.default(200, booking, 'Booking details fetched successfully'));
});
exports.createBooking = (0, asyncHandler_js_1.default)(async (req, res) => {
    // If no user is logged in, we allow public booking by creating/finding a guest client
    const { title, description, bookingDate, bookingTime, status, propertyAddress, clientId, clientName, clientPhone, amountReceived, amountDue, paymentNote, surveyorId // Added for client portal bookings
     } = req.body;
    let targetUserId;
    let targetClientId;
    let finalStatus;
    if (req.user) {
        const role = req.user.role;
        if (role === 'client') {
            // If logged-in client is booking
            let surveyor;
            if (surveyorId) {
                surveyor = await prisma_js_1.prisma.user.findFirst({
                    where: { id: surveyorId, role: 'surveyor' }
                });
            }
            else {
                surveyor = await prisma_js_1.prisma.user.findFirst({
                    where: { role: 'surveyor' }
                });
            }
            if (!surveyor) {
                throw new ApiError_js_1.default(404, 'No surveyor found to accept bookings');
            }
            targetUserId = surveyor.id;
            finalStatus = 'pending';
            const clientRecord = await prisma_js_1.prisma.client.findFirst({
                where: { accountId: req.user.id, userId: targetUserId }
            });
            if (!clientRecord) {
                const newClient = await prisma_js_1.prisma.client.create({
                    data: {
                        userId: targetUserId,
                        accountId: req.user.id,
                        name: req.user.name || clientName,
                        email: req.user.email,
                        phone: req.user.phone || clientPhone || 'N/A'
                    }
                });
                targetClientId = newClient.id;
            }
            else {
                targetClientId = clientRecord.id;
            }
        }
        else {
            // Admin or Surveyor creating booking
            targetUserId = (role === 'admin' && surveyorId) ? surveyorId : req.user.id;
            finalStatus = status || 'scheduled';
            if (clientId) {
                const existingClient = await prisma_js_1.prisma.client.findFirst({
                    where: { id: clientId, userId: targetUserId }
                });
                if (!existingClient) {
                    throw new ApiError_js_1.default(404, 'Selected client not found for this surveyor');
                }
                targetClientId = existingClient.id;
            }
            else if (clientName) {
                let client = await prisma_js_1.prisma.client.findFirst({
                    where: {
                        userId: targetUserId,
                        OR: [
                            { name: clientName, phone: clientPhone },
                            { phone: clientPhone }
                        ]
                    }
                });
                if (!client) {
                    client = await prisma_js_1.prisma.client.create({
                        data: {
                            userId: targetUserId,
                            name: clientName,
                            email: `${Date.now()}@temp.com`,
                            phone: clientPhone || 'N/A'
                        }
                    });
                }
                targetClientId = client.id;
            }
            else {
                throw new ApiError_js_1.default(400, 'Client ID or Client Name is required');
            }
        }
    }
    else {
        // Public/Guest Booking
        if (!surveyorId)
            throw new ApiError_js_1.default(400, 'Surveyor ID is required for public booking');
        if (!clientName || !clientPhone)
            throw new ApiError_js_1.default(400, 'Client Name and Phone are required');
        targetUserId = surveyorId;
        finalStatus = 'pending';
        // Find or create a guest client record for this surveyor
        let client = await prisma_js_1.prisma.client.findFirst({
            where: {
                userId: targetUserId,
                phone: clientPhone
            }
        });
        if (!client) {
            client = await prisma_js_1.prisma.client.create({
                data: {
                    userId: targetUserId,
                    name: clientName,
                    email: `${Date.now()}@guest.com`,
                    phone: clientPhone
                }
            });
        }
        targetClientId = client.id;
    }
    // Normalize date to UTC midnight using robust YYYY-MM-DD parsing
    const dateStr = typeof bookingDate === 'string' ? bookingDate.split('T')[0] : bookingDate.toISOString().split('T')[0];
    const normalizedDate = new Date(`${dateStr}T00:00:00.000Z`);
    const isBlocked = await prisma_js_1.prisma.blockedDate.findFirst({
        where: {
            userId: targetUserId,
            date: normalizedDate
        }
    });
    if (isBlocked) {
        throw new ApiError_js_1.default(400, 'This date is blocked. Please select another date.');
    }
    const booking = await prisma_js_1.prisma.booking.create({
        data: {
            userId: targetUserId,
            clientId: targetClientId,
            title,
            description,
            bookingDate: normalizedDate,
            bookingTime,
            status: finalStatus,
            propertyAddress,
            amountReceived: parseFloat(amountReceived) || 0,
            amountDue: parseFloat(amountDue) || 0,
            paymentNote
        },
        include: { client: true }
    });
    // Create notification for the surveyor (only if the one creating it is NOT the surveyor themselves)
    const isSelfBooking = req.user && req.user.id === targetUserId;
    if (!isSelfBooking) {
        try {
            const displayClientName = req.user ? (req.user.name || 'A client') : (clientName || 'A guest client');
            const timeStr = bookingTime ? ` at ${bookingTime}` : '';
            await prisma_js_1.prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type: 'NEW_BOOKING',
                    title: 'New Booking Request',
                    message: `${displayClientName} has booked a new survey for ${normalizedDate.toLocaleDateString()}${timeStr}.`,
                    link: '/dashboard/bookings?filter=pending'
                }
            });
            console.log(`Notification created for surveyor ${targetUserId}`);
        }
        catch (notifError) {
            console.error('Error creating notification:', notifError);
        }
    }
    res.status(201).json(new ApiResponse_js_1.default(201, booking, 'Booking created successfully'));
});
exports.updateBooking = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const where = req.user.role === 'client'
        ? { id: req.params.id, client: { accountId: req.user.id } }
        : { id: req.params.id, userId: req.user.id };
    const booking = await prisma_js_1.prisma.booking.findFirst({
        where
    });
    if (!booking) {
        throw new ApiError_js_1.default(404, 'Booking not found');
    }
    const data = { ...req.body };
    if (data.bookingDate) {
        const dateStr = typeof data.bookingDate === 'string' ? data.bookingDate.split('T')[0] : data.bookingDate.toISOString().split('T')[0];
        const newDate = new Date(`${dateStr}T00:00:00.000Z`);
        if (newDate.getTime() !== new Date(booking.bookingDate).getTime()) {
            const isBlocked = await prisma_js_1.prisma.blockedDate.findFirst({
                where: {
                    userId: req.user.id,
                    date: newDate
                }
            });
            if (isBlocked) {
                throw new ApiError_js_1.default(400, 'This date is blocked. Please select another date.');
            }
            data.bookingDate = newDate;
        }
    }
    if (data.amountReceived !== undefined)
        data.amountReceived = parseFloat(data.amountReceived);
    if (data.amountDue !== undefined)
        data.amountDue = parseFloat(data.amountDue);
    if (data.status)
        data.status = data.status;
    const updatedBooking = await prisma_js_1.prisma.booking.update({
        where: { id: req.params.id },
        data,
        include: { client: true, user: { select: { name: true } } }
    });
    // Create notification if status is updated
    if (data.status && data.status !== booking.status) {
        let title = 'Booking Update';
        let message = `Your booking status has been changed to "${data.status}".`;
        if (data.status === 'scheduled') {
            title = 'Booking Approved';
            const timeStr = updatedBooking.bookingTime ? ` at ${updatedBooking.bookingTime}` : '';
            message = `Your booking has been approved and scheduled for ${new Date(updatedBooking.bookingDate).toLocaleDateString()}${timeStr}.`;
        }
        else if (data.status === 'cancelled') {
            title = 'Booking Cancelled';
            message = `Your booking has been cancelled.`;
        }
        // Notify the client
        if (updatedBooking.client.accountId) {
            try {
                await prisma_js_1.prisma.notification.create({
                    data: {
                        userId: updatedBooking.client.accountId,
                        type: 'STATUS_UPDATE',
                        title,
                        message,
                        link: '/dashboard/bookings'
                    }
                });
            }
            catch (notifError) {
                console.error('Error creating status update notification:', notifError);
            }
        }
    }
    // Create notification for payment update
    if ((data.amountReceived !== undefined && data.amountReceived !== booking.amountReceived) ||
        (data.amountDue !== undefined && data.amountDue !== booking.amountDue)) {
        if (updatedBooking.client.accountId) {
            try {
                await prisma_js_1.prisma.notification.create({
                    data: {
                        userId: updatedBooking.client.accountId,
                        type: 'PAYMENT_UPDATE',
                        title: 'Payment Updated',
                        message: `Payment information for your booking "${updatedBooking.title}" has been updated. Due: TK ${updatedBooking.amountDue}`,
                        link: '/dashboard/bookings'
                    }
                });
            }
            catch (notifError) {
                console.error('Error creating payment update notification:', notifError);
            }
        }
    }
    res.status(200).json(new ApiResponse_js_1.default(200, updatedBooking, 'Booking updated successfully'));
});
exports.deleteBooking = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const where = req.user.role === 'client'
        ? { id: req.params.id, client: { accountId: req.user.id } }
        : { id: req.params.id, userId: req.user.id };
    const booking = await prisma_js_1.prisma.booking.findFirst({
        where
    });
    if (!booking) {
        throw new ApiError_js_1.default(404, 'Booking not found');
    }
    await prisma_js_1.prisma.booking.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'Booking deleted successfully'));
});
exports.getUpcomingBookings = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const limit = parseInt(req.query.limit) || 3;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const where = req.user.role === 'client'
        ? { client: { accountId: req.user.id }, bookingDate: { gte: today }, status: { not: 'cancelled' } }
        : { userId: req.user.id, bookingDate: { gte: today }, status: { not: 'cancelled' } };
    const bookings = await prisma_js_1.prisma.booking.findMany({
        where,
        orderBy: { bookingDate: 'asc' },
        take: limit,
        include: { client: { select: { name: true } } }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, bookings, 'Upcoming bookings fetched successfully'));
});
exports.getCalendarData = (0, asyncHandler_js_1.default)(async (req, res) => {
    let userId;
    const { surveyorId } = req.query;
    if (surveyorId) {
        // If surveyorId is provided, use it (typically for public view)
        userId = surveyorId;
    }
    else if (req.user) {
        // If logged in and no surveyorId in query, strictly use the logged-in user's ID
        userId = req.user.id;
    }
    else {
        // If not logged in and no surveyorId provided, this should be an error or return empty
        // To prevent data leakage, we won't return a "default" surveyor's data
        return res.status(200).json(new ApiResponse_js_1.default(200, { blockedDates: [], bookedDates: [] }, 'No surveyor context found'));
    }
    let month = req.query.month ? parseInt(req.query.month) : new Date().getUTCMonth() + 1;
    let year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();
    // Validate month and year
    if (isNaN(month) || month < 1 || month > 12) {
        month = new Date().getUTCMonth() + 1;
    }
    if (isNaN(year) || year < 1900 || year > 2100) {
        year = new Date().getUTCFullYear();
    }
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const [blockedDates, bookings] = await Promise.all([
        prisma_js_1.prisma.blockedDate.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate }
            },
            select: { date: true, reason: true }
        }),
        prisma_js_1.prisma.booking.findMany({
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
    res.status(200).json(new ApiResponse_js_1.default(200, calendarData, 'Calendar data fetched successfully'));
});
//# sourceMappingURL=booking.controller.js.map