"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCalculation = exports.saveCalculation = exports.getCalculations = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getCalculations = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt((req.query.limit || req.query.limit)) || 10;
    const search = req.query.search;
    const userId = req.user.id;
    const skip = (page - 1) * limit;
    const where = { userId };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { booking: { title: { contains: search, mode: 'insensitive' } } }
        ];
    }
    const [calculations, totalCount] = await Promise.all([
        prisma_js_1.prisma.calculation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { booking: { select: { title: true, client: { select: { name: true } } } } },
            skip,
            take: limit
        }),
        prisma_js_1.prisma.calculation.count({ where })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        calculations,
        meta: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 'Calculations fetched successfully'));
});
exports.saveCalculation = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const { title, type, inputData, resultData, bookingId } = req.body;
    // Start a transaction to ensure atomicity
    const calculation = await prisma_js_1.prisma.$transaction(async (tx) => {
        // If bookingId is provided, delete existing calculations and maps for this booking
        if (bookingId) {
            // 1. Delete existing calculations for this booking
            await tx.calculation.deleteMany({
                where: { bookingId, userId: req.user.id }
            });
            // 2. Delete existing maps for this booking
            await tx.savedMap.deleteMany({
                where: { bookingId, userId: req.user.id }
            });
        }
        // 3. Create the new calculation
        return await tx.calculation.create({
            data: {
                userId: req.user.id,
                title,
                bookingId,
                type,
                inputData,
                resultData
            }
        });
    });
    res.status(201).json(new ApiResponse_js_1.default(201, calculation, 'Calculation saved successfully'));
});
exports.deleteCalculation = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const calculation = await prisma_js_1.prisma.calculation.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!calculation) {
        throw new ApiError_js_1.default(404, 'Calculation not found');
    }
    await prisma_js_1.prisma.calculation.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'Calculation deleted successfully'));
});
//# sourceMappingURL=calculation.controller.js.map