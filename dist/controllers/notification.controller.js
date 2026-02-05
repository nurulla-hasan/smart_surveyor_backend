"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.clearAllNotifications = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getNotifications = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const notifications = await prisma_js_1.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    const unreadCount = await prisma_js_1.prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, { notifications, unreadCount }, 'Notifications fetched successfully'));
});
exports.markAsRead = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const notification = await prisma_js_1.prisma.notification.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
        throw new ApiError_js_1.default(404, 'Notification not found');
    }
    const updatedNotification = await prisma_js_1.prisma.notification.update({
        where: { id: req.params.id },
        data: { isRead: true }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, updatedNotification, 'Notification marked as read'));
});
exports.markAllAsRead = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    await prisma_js_1.prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'All notifications marked as read'));
});
exports.clearAllNotifications = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    await prisma_js_1.prisma.notification.deleteMany({
        where: { userId: req.user.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'All notifications cleared successfully'));
});
exports.deleteNotification = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const notification = await prisma_js_1.prisma.notification.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
        throw new ApiError_js_1.default(404, 'Notification not found');
    }
    await prisma_js_1.prisma.notification.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'Notification deleted successfully'));
});
//# sourceMappingURL=notification.controller.js.map