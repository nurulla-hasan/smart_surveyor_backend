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
    const calculations = await prisma_js_1.prisma.calculation.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: { booking: { select: { title: true } } }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, calculations, 'Calculations fetched successfully'));
});
exports.saveCalculation = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const { title, type, inputData, resultData, bookingId } = req.body;
    const calculation = await prisma_js_1.prisma.calculation.create({
        data: {
            userId: req.user.id,
            title,
            bookingId,
            type,
            inputData,
            resultData
        }
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