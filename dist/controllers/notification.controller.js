import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
export const getNotifications = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    const unreadCount = await prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
    });
    res.status(200).json(new ApiResponse(200, { notifications, unreadCount }, 'Notifications fetched successfully'));
});
export const markAsRead = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const notification = await prisma.notification.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }
    const updatedNotification = await prisma.notification.update({
        where: { id: req.params.id },
        data: { isRead: true }
    });
    res.status(200).json(new ApiResponse(200, updatedNotification, 'Notification marked as read'));
});
export const markAllAsRead = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true }
    });
    res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});
export const deleteNotification = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const notification = await prisma.notification.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }
    await prisma.notification.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse(200, {}, 'Notification deleted successfully'));
});
//# sourceMappingURL=notification.controller.js.map