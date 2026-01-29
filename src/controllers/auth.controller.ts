import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AuthService } from '../services/auth.service.js';

const sendTokenResponse = (data: { user: any, token: string }, statusCode: number, res: Response) => {
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', data.token, options)
    .json(new ApiResponse(statusCode, data, 'Authentication successful'));
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

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - req.user is added by protect middleware
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { password, ...userWithoutPassword } = user;

  res.status(200).json(new ApiResponse(200, userWithoutPassword, 'User profile fetched successfully'));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
});
