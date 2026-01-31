import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
export const getClients = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
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
        prisma.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize
        }),
        prisma.client.count({ where })
    ]);
    res.status(200).json(new ApiResponse(200, {
        clients,
        meta: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            pageSize: pageSize
        }
    }, 'Clients fetched successfully'));
});
export const getClient = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const client = await prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError(404, 'Client not found');
    }
    res.status(200).json(new ApiResponse(200, client, 'Client details fetched successfully'));
});
export const createClient = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const { name, email, phone, address } = req.body;
    const clientEmail = email || 'no-email@example.com';
    const existingClient = await prisma.client.findFirst({
        where: { userId: req.user.id, email: clientEmail }
    });
    if (existingClient) {
        throw new ApiError(400, 'Client with this email already exists');
    }
    const client = await prisma.client.create({
        data: {
            userId: req.user.id,
            name,
            email: clientEmail,
            phone,
            address
        }
    });
    res.status(201).json(new ApiResponse(201, client, 'Client created successfully'));
});
export const updateClient = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const client = await prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError(404, 'Client not found');
    }
    // Prevent updating restricted fields
    const { id, userId, createdAt, updatedAt, ...updateData } = req.body;
    const updatedClient = await prisma.client.update({
        where: { id: req.params.id },
        data: updateData
    });
    res.status(200).json(new ApiResponse(200, updatedClient, 'Client updated successfully'));
});
export const deleteClient = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, 'Not authorized');
    const client = await prisma.client.findFirst({
        where: { id: req.params.id, userId: req.user.id }
    });
    if (!client) {
        throw new ApiError(404, 'Client not found');
    }
    await prisma.client.delete({
        where: { id: req.params.id }
    });
    res.status(200).json(new ApiResponse(200, {}, 'Client deleted successfully'));
});
//# sourceMappingURL=client.controller.js.map