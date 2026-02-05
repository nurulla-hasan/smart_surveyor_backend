import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt((req.query.limit || req.query.limit) as string) || 10;
  const search = req.query.search as string | undefined;

  const skip = (page - 1) * limit;

  const where: any = req.user.role === 'client'
    ? { client: { accountId: req.user.id } }
    : { userId: req.user.id };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { mouzaName: { contains: search, mode: 'insensitive' } },
      { plotNo: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [reports, totalCount] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true, email: true } } },
      skip,
      take: limit
    }),
    prisma.report.count({ where })
  ]);

  res.status(200).json(new ApiResponse(200, {
    reports,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }, 'Reports fetched successfully'));
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const where: any = req.user.role === 'client'
    ? { id: req.params.id as string, client: { accountId: req.user.id } }
    : { id: req.params.id as string, userId: req.user.id };

  const report = await prisma.report.findFirst({
    where,
    include: { 
      client: { select: { id: true, name: true, email: true, phone: true } },
      booking: { select: { id: true, title: true, bookingDate: true } }
    }
  });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.status(200).json(new ApiResponse(200, report, 'Report details fetched successfully'));
});

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  // Parse JSON data from the "data" field in FormData
  let bodyData;
  try {
    bodyData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
  } catch (error) {
    throw new ApiError(400, 'Invalid JSON format in data field');
  }

  const { 
    title, content, clientId, bookingId,
    mouzaName, plotNo, areaSqFt, areaKatha, areaDecimal, notes
  } = bodyData;

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: req.user.id }
  });
  if (!client) {
    throw new ApiError(400, 'Invalid Client ID');
  }

  // Handle file upload
  let fileUrl = '';
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (cloudinaryResponse) {
      fileUrl = cloudinaryResponse.secure_url;
    }
  }

  const report = await prisma.report.create({
    data: {
      userId: req.user.id,
      clientId: clientId as string,
      bookingId: (bookingId as string) || null,
      title: title as string,
      content: content as string,
      mouzaName: (mouzaName as string) || null,
      plotNo: (plotNo as string) || null,
      areaSqFt: areaSqFt ? parseFloat(areaSqFt.toString()) : null,
      areaKatha: areaKatha ? parseFloat(areaKatha.toString()) : null,
      areaDecimal: areaDecimal ? parseFloat(areaDecimal.toString()) : null,
      notes: (notes as string) || null,
      fileUrl: (fileUrl as string) || ''
    },
    include: { client: true }
  });

  // Create notification for the client if they have an account
  if (report.client.accountId) {
    try {
      await prisma.notification.create({
        data: {
          userId: report.client.accountId,
          type: 'REPORT_PUBLISHED',
          title: 'New Report Published',
          message: `The survey report for "${report.title}" has been published.`,
          link: '/dashboard/reports'
        }
      });
    } catch (notifError) {
      console.error('Error creating report notification:', notifError);
    }
  }

  res.status(201).json(new ApiResponse(201, report, 'Report created successfully'));
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const existingReport = await prisma.report.findFirst({
    where: { id: req.params.id as string, userId: req.user.id }
  });

  if (!existingReport) {
    throw new ApiError(404, 'Report not found');
  }

  // Parse JSON data from the "data" field in FormData (same as create)
  let bodyData;
  try {
    bodyData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
  } catch (error) {
    throw new ApiError(400, 'Invalid JSON format in data field');
  }

  const { 
    title, content, clientId, bookingId,
    mouzaName, plotNo, areaSqFt, areaKatha, areaDecimal, notes
  } = bodyData;

  // Handle file upload if a new file is provided
  let fileUrl = existingReport.fileUrl;
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (cloudinaryResponse) {
      fileUrl = cloudinaryResponse.secure_url;
    }
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (clientId !== undefined) updateData.clientId = clientId;
  if (bookingId !== undefined) updateData.bookingId = bookingId || null;
  if (mouzaName !== undefined) updateData.mouzaName = mouzaName || null;
  if (plotNo !== undefined) updateData.plotNo = plotNo || null;
  if (areaSqFt !== undefined) updateData.areaSqFt = areaSqFt ? parseFloat(areaSqFt.toString()) : null;
  if (areaKatha !== undefined) updateData.areaKatha = areaKatha ? parseFloat(areaKatha.toString()) : null;
  if (areaDecimal !== undefined) updateData.areaDecimal = areaDecimal ? parseFloat(areaDecimal.toString()) : null;
  if (notes !== undefined) updateData.notes = notes || null;
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

  const updatedReport = await prisma.report.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { client: true }
  });

  // Create notification for the client if they have an account
  if (updatedReport.client.accountId) {
    try {
      await prisma.notification.create({
        data: {
          userId: updatedReport.client.accountId,
          type: 'REPORT_UPDATED',
          title: 'Report Updated',
          message: `The survey report for "${updatedReport.title}" has been updated.`,
          link: '/dashboard/reports'
        }
      });
    } catch (notifError) {
      console.error('Error creating report update notification:', notifError);
    }
  }

  res.status(200).json(new ApiResponse(200, updatedReport, 'Report updated successfully'));
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const report = await prisma.report.findFirst({
    where: { id: req.params.id as string, userId: req.user.id }
  });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  await prisma.report.delete({
    where: { id: req.params.id as string }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Report deleted successfully'));
});
