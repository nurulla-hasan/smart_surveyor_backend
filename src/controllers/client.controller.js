import Client from '../models/Client.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getClients = asyncHandler(async (req, res) => {
  const { query: searchQuery, page = 1, pageSize = 10 } = req.query;
  const userId = req.user.id;

  const query = { userId };

  if (searchQuery) {
    query.$or = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { email: { $regex: searchQuery, $options: 'i' } },
      { phone: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * pageSize;

  const [clients, totalCount] = await Promise.all([
    Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize)),
    Client.countDocuments(query)
  ]);

  res.status(200).json(new ApiResponse(200, {
    clients,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    currentPage: parseInt(page)
  }, 'Clients fetched successfully'));
});

export const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, userId: req.user.id });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  res.status(200).json(new ApiResponse(200, client, 'Client details fetched successfully'));
});

export const createClient = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  
  const existingClient = await Client.findOne({ userId: req.user.id, email });
  if (existingClient) {
    throw new ApiError(400, 'Client with this email already exists');
  }

  const client = await Client.create({
    userId: req.user.id,
    name,
    email: email || 'no-email@example.com',
    phone,
    address
  });

  res.status(201).json(new ApiResponse(201, client, 'Client created successfully'));
});

export const updateClient = asyncHandler(async (req, res) => {
  let client = await Client.findOne({ _id: req.params.id, userId: req.user.id });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(new ApiResponse(200, client, 'Client updated successfully'));
});

export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, userId: req.user.id });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  await client.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, 'Client deleted successfully'));
});
