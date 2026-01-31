import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AuthService } from '../services/auth.service.js';

const sendTokenResponse = (data: { accessToken: string, refreshToken: string }, statusCode: number, res: Response) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('refreshToken', data.refreshToken, cookieOptions)
    .json(new ApiResponse(statusCode, { 
      accessToken: data.accessToken,
      refreshToken: data.refreshToken 
    }, 'Authentication successful'));
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  sendTokenResponse(result, 201, res);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide an email and password');
  }

  const result = await AuthService.login(email, password);
  sendTokenResponse(result, 200, res);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const result = await AuthService.refreshToken(refreshToken);
  res.status(200).json(new ApiResponse(200, result, 'Token refreshed successfully'));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - req.user is added by protect middleware
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { password, resetPasswordToken, resetPasswordExpire, ...userProfile } = user;

  res.status(200).json(new ApiResponse(200, userProfile, 'User profile fetched successfully'));
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
});
