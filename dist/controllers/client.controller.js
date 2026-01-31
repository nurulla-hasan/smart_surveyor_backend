"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.createClient = exports.getClient = exports.getClients = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const ApiResponse_js_1 = __importDefault(require("../utils/ApiResponse.js"));
const asyncHandler_js_1 = __importDefault(require("../utils/asyncHandler.js"));
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
exports.getClients = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const searchQuery = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const userId = req.user.id;
    const where = { userId };
    if (searchQuery) {
        where.OR = [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { phone: { contains: searchQuery, mode: 'insensitive' } }
        ];
    }
    const skip = (page - 1) * pageSize;
    const [clients, totalCount] = await Promise.all([
        prisma_js_1.prisma.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize
        }),
        prisma_js_1.prisma.client.count({ where })
    ]);
    res.status(200).json(new ApiResponse_js_1.default(200, {
        clients,
        meta: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            pageSize: pageSize
        }
    }, 'Clients fetched successfully'));
});
exports.getClient = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const client = await prisma_js_1.prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError_js_1.default(404, 'Client not found');
    }
    res.status(200).json(new ApiResponse_js_1.default(200, client, 'Client details fetched successfully'));
});
exports.createClient = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const { name, email, phone, address } = req.body;
    const clientEmail = email || 'no-email@example.com';
    const existingClient = await prisma_js_1.prisma.client.findFirst({
        where: { userId: req.user.id, email: clientEmail }
    });
    if (existingClient) {
        throw new ApiError_js_1.default(400, 'Client with this email already exists');
    }
    const client = await prisma_js_1.prisma.client.create({
        data: {
            userId: req.user.id,
            name,
            email: clientEmail,
            phone,
            address
        }
    });
    res.status(201).json(new ApiResponse_js_1.default(201, client, 'Client created successfully'));
});
exports.updateClient = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const client = await prisma_js_1.prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError_js_1.default(404, 'Client not found');
    }
    // Prevent updating restricted fields
    const { id, userId, createdAt, updatedAt, ...updateData } = req.body;
    const updatedClient = await prisma_js_1.prisma.client.update({
        where: { id: req.params.id },
        data: updateData
    });
    res.status(200).json(new ApiResponse_js_1.default(200, updatedClient, 'Client updated successfully'));
});
exports.deleteClient = (0, asyncHandler_js_1.default)(async (req, res) => {
    if (!req.user)
        throw new ApiError_js_1.default(401, 'Not authorized');
    const client = await prisma_js_1.prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError_js_1.default(404, 'Client not found');
    }
    await prisma_js_1.prisma.client.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse_js_1.default(200, {}, 'Client deleted successfully'));
});
//# sourceMappingURL=client.controller.js.map