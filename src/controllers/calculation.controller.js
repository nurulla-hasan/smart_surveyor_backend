import Calculation from '../models/Calculation.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getCalculations = asyncHandler(async (req, res) => {
  const calculations = await Calculation.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('bookingId', 'title');

  res.status(200).json(new ApiResponse(200, calculations, 'Calculations fetched successfully'));
});

export const saveCalculation = asyncHandler(async (req, res) => {
  const { type, inputData, resultData, bookingId } = req.body;

  const calculation = await Calculation.create({
    userId: req.user.id,
    bookingId,
    type,
    inputData,
    resultData
  });

  res.status(201).json(new ApiResponse(201, calculation, 'Calculation saved successfully'));
});

export const deleteCalculation = asyncHandler(async (req, res) => {
  const calculation = await Calculation.findOne({ _id: req.params.id, userId: req.user.id });

  if (!calculation) {
    throw new ApiError(404, 'Calculation not found');
  }

  await calculation.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, 'Calculation deleted successfully'));
});
