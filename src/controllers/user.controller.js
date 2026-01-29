import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const fields = ['name', 'phone', 'companyName', 'licenseNo', 'address'];
  const data = {};
  
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, data, {
    new: true,
    runValidators: true
  });

  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});
