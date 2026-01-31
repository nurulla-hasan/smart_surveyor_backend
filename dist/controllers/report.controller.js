"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.updateReport = exports.createReport = exports.getReport = exports.getReports = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
const cloudinary_js_1 = require("../utils/cloudinary.js");
exports.getReports = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search;
    const userId = req.user.id;
    const skip = (page - 1) * pageSize;
    const where = { userId };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { mouzaName: { contains: search, mode: 'insensitive' } },
            { plotNo: { contains: search, mode: 'insensitive' } },
            { client: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }
    const [reports, totalCount] = await Promise.all([
        prisma_js_1.prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { client: { select: { id: true, name: true, email: true } } },
            skip,
            take: pageSize
        }),
        prisma_js_1.prisma.report.count({ where })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        reports,
        meta: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            pageSize: pageSize
        }
    }, 'Reports fetched successfully'));
});
exports.getReport = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const report = await prisma_js_1.prisma.report.findFirst({
        where: { id: req.params.id, userId: req.user.id },
        include: {
            client: { select: { id: true, name: true, email: true, phone: true } },
            booking: { select: { id: true, title: true, bookingDate: true } }
        }
    });
    if (!report) {
        throw new ApiError_js_1.default(404, 'Report not found');
    }
    res.status(200).json(new ApiResponse_js_1.default(200, report, 'Report details fetched successfully'));
});
exports.createReport = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    // Parse JSON data from the "data" field in FormData
    let bodyData;
    try {
        bodyData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    }
    catch (error) {
        throw new ApiError_js_1.default(400, 'Invalid JSON format in data field');
    }
    const { title, content, clientId, bookingId, mouzaName, plotNo, areaSqFt, areaKatha, areaDecimal, notes } = bodyData;
    const client = await prisma_js_1.prisma.client.findFirst({
        where: { id: clientId, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError_js_1.default(400, 'Invalid Client ID');
    }
    // Handle file upload
    let fileUrl = '';
    if (req.file) {
        const cloudinaryResponse = await (0, cloudinary_js_1.uploadOnCloudinary)(req.file.path);
        if (cloudinaryResponse) {
            fileUrl = cloudinaryResponse.secure_url;
        }
    }
    const report = await prisma_js_1.prisma.report.create({
        data: {
            userId: req.user.id,
            clientId: clientId,
            bookingId: bookingId || null,
            title: title,
            content: content,
            mouzaName: mouzaName || null,
            plotNo: plotNo || null,
            areaSqFt: areaSqFt ? parseFloat(areaSqFt.toString()) : null,
            areaKatha: areaKatha ? parseFloat(areaKatha.toString()) : null,
            areaDecimal: areaDecimal ? parseFloat(areaDecimal.toString()) : null,
            notes: notes || null,
            fileUrl: fileUrl || ''
        },
        include: { client: true }
    });
    res.status(201).json(new ApiResponse_js_1.default(201, report, 'Report created successfully'));
});
exports.updateReport = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const existingReport = await prisma_js_1.prisma.report.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!existingReport) {
        throw new ApiError_js_1.default(404, 'Report not found');
    }
    // Parse JSON data from the "data" field in FormData (same as create)
    let bodyData;
    try {
        bodyData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    }
    catch (error) {
        throw new ApiError_js_1.default(400, 'Invalid JSON format in data field');
    }
    const { title, content, clientId, bookingId, mouzaName, plotNo, areaSqFt, areaKatha, areaDecimal, notes } = bodyData;
    // Handle file upload if a new file is provided
    let fileUrl = existingReport.fileUrl;
    if (req.file) {
        const cloudinaryResponse = await (0, cloudinary_js_1.uploadOnCloudinary)(req.file.path);
        if (cloudinaryResponse) {
            fileUrl = cloudinaryResponse.secure_url;
        }
    }
    const updateData = {};
    if (title !== undefined)
        updateData.title = title;
    if (content !== undefined)
        updateData.content = content;
    if (clientId !== undefined)
        updateData.clientId = clientId;
    if (bookingId !== undefined)
        updateData.bookingId = bookingId || null;
    if (mouzaName !== undefined)
        updateData.mouzaName = mouzaName || null;
    if (plotNo !== undefined)
        updateData.plotNo = plotNo || null;
    if (areaSqFt !== undefined)
        updateData.areaSqFt = areaSqFt ? parseFloat(areaSqFt.toString()) : null;
    if (areaKatha !== undefined)
        updateData.areaKatha = areaKatha ? parseFloat(areaKatha.toString()) : null;
    if (areaDecimal !== undefined)
        updateData.areaDecimal = areaDecimal ? parseFloat(areaDecimal.toString()) : null;
    if (notes !== undefined)
        updateData.notes = notes || null;
    if (fileUrl !== undefined)
        updateData.fileUrl = fileUrl;
    const updatedReport = await prisma_js_1.prisma.report.update({
        where: { id: req.params.id },
        data: updateData,
        include: { client: true }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, updatedReport, 'Report updated successfully'));
});
exports.deleteReport = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const report = await prisma_js_1.prisma.report.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!report) {
        throw new ApiError_js_1.default(404, 'Report not found');
    }
    await prisma_js_1.prisma.report.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'Report deleted successfully'));
});
//# sourceMappingURL=report.controller.js.map