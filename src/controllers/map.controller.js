import SavedMap from '../models/SavedMap.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMaps = asyncHandler(async (req, res) => {
  const maps = await SavedMap.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, maps, 'Maps fetched successfully'));
});

export const saveMap = asyncHandler(async (req, res) => {
  const { name, data } = req.body;

  const map = await SavedMap.create({
    userId: req.user.id,
    name,
    data
  });

  res.status(201).json(new ApiResponse(201, map, 'Map saved successfully'));
});

export const deleteMap = asyncHandler(async (req, res) => {
  const map = await SavedMap.findOne({ _id: req.params.id, userId: req.user.id });

  if (!map) {
    throw new ApiError(404, 'Map not found');
  }

  await map.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, 'Map deleted successfully'));
});
