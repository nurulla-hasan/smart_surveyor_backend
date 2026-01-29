import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const userId = req.user.id;

  const skip = (page - 1) * pageSize;

  const [reports, totalCount] = await Promise.all([
    prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true, email: true } } },
      skip,
      take: pageSize
    }),
    prisma.report.count({ where: { userId } })
  ]);

  res.status(200).json(new ApiResponse(200, {
    reports,
    meta: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize: pageSize
    }
  }, 'Reports fetched successfully'));
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const report = await prisma.report.findFirst({
    where: { id: req.params.id, userId: req.user.id },
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

  const { 
    title, content, clientId, bookingId, fileUrl,
    mouzaName, plotNo, areaSqFt, areaKatha, areaDecimal, notes
  } = req.body;

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: req.user.id }
  });
  if (!client) {
    throw new ApiError(400, 'Invalid Client ID');
  }

  const report = await prisma.report.create({
    data: {
      userId: req.user.id,
      clientId,
      bookingId,
      title,
      content,
      mouzaName,
      plotNo,
      areaSqFt: areaSqFt ? parseFloat(areaSqFt) : undefined,
      areaKatha: areaKatha ? parseFloat(areaKatha) : undefined,
      areaDecimal: areaDecimal ? parseFloat(areaDecimal) : undefined,
      notes,
      fileUrl
    },
    include: { client: true }
  });

  res.status(201).json(new ApiResponse(201, report, 'Report created successfully'));
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const report = await prisma.report.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const data = { ...req.body };
  if (data.areaSqFt) data.areaSqFt = parseFloat(data.areaSqFt);
  if (data.areaKatha) data.areaKatha = parseFloat(data.areaKatha);
  if (data.areaDecimal) data.areaDecimal = parseFloat(data.areaDecimal);

  const updatedReport = await prisma.report.update({
    where: { id: req.params.id },
    data,
    include: { client: true }
  });

  res.status(200).json(new ApiResponse(200, updatedReport, 'Report updated successfully'));
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Not authorized');

  const report = await prisma.report.findFirst({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  await prisma.report.delete({
    where: { id: req.params.id }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Report deleted successfully'));
});
