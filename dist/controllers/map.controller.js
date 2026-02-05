"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMap = exports.getClientSharedMaps = exports.saveMap = exports.getMaps = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getMaps = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [maps, totalCount] = await Promise.all([
        prisma_js_1.prisma.savedMap.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma_js_1.prisma.savedMap.count({ where: { userId: req.user.id } })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        maps,
        meta: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            limit: limit
        }
    }, 'Maps fetched successfully'));
});
exports.saveMap = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const { name, data, fileUrl, bookingId, area, perimeter } = req.body;
    // Basic validation for MongoDB ObjectID if bookingId is provided
    if (bookingId && !/^[0-9a-fA-F]{24}$/.test(bookingId)) {
        throw new ApiError_js_1.default(400, 'Invalid Booking ID format');
    }
    const map = await prisma_js_1.prisma.savedMap.create({
        data: {
            userId: req.user.id,
            bookingId: bookingId || null,
            name,
            data,
            area: area ? parseFloat(area) : null,
            perimeter: perimeter ? parseFloat(perimeter) : null,
            fileUrl
        }
    });
    res.status(201).json(new ApiResponse_js_1.default(201, map, 'Map saved successfully'));
});
exports.getClientSharedMaps = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = {
        booking: {
            client: {
                accountId: req.user.id
            }
        }
    };
    // Find all maps linked to bookings where the current user is the client
    const [maps, totalCount] = await Promise.all([
        prisma_js_1.prisma.savedMap.findMany({
            where,
            include: {
                booking: {
                    select: {
                        title: true,
                        bookingDate: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma_js_1.prisma.savedMap.count({ where })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        maps,
        meta: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            limit: limit
        }
    }, 'Shared maps fetched successfully'));
});
exports.deleteMap = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const map = await prisma_js_1.prisma.savedMap.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!map) {
        throw new ApiError_js_1.default(404, 'Map not found');
    }
    await prisma_js_1.prisma.savedMap.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'Map deleted successfully'));
});
//# sourceMappingURL=map.controller.js.map