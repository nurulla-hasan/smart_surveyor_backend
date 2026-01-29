import Report from '../models/Report.js';
import Client from '../models/Client.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getReports = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const userId = req.user.id;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);

  const [reports, totalCount] = await Promise.all([
    Report.find({ userId })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name email')
      .skip(skip)
      .limit(parseInt(pageSize)),
    Report.countDocuments({ userId })
  ]);

  res.status(200).json(new ApiResponse(200, {
    reports,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
    currentPage: parseInt(page)
  }, 'Reports fetched successfully'));
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, userId: req.user.id })
    .populate('clientId', 'name email phone')
    .populate('bookingId', 'title bookingDate');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.status(200).json(new ApiResponse(200, report, 'Report details fetched successfully'));
});

export const createReport = asyncHandler(async (req, res) => {
  const { title, content, clientId, bookingId, fileUrl } = req.body;

  const client = await Client.findOne({ _id: clientId, userId: req.user.id });
  if (!client) {
    throw new ApiError(400, 'Invalid Client ID');
  }

  const report = await Report.create({
    userId: req.user.id,
    clientId,
    bookingId,
    title,
    content,
    fileUrl
  });

  res.status(201).json(new ApiResponse(201, report, 'Report created successfully'));
});

export const updateReport = asyncHandler(async (req, res) => {
  let report = await Report.findOne({ _id: req.params.id, userId: req.user.id });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  report = await Report.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(new ApiResponse(200, report, 'Report updated successfully'));
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, userId: req.user.id });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  await report.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, 'Report deleted successfully'));
});
