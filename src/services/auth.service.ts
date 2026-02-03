import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth.js';
import ApiError from '../utils/ApiError.js';

export class AuthService {
  static async register(data: any) {
    const userExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) {
      throw new ApiError(400, 'User already exists with this email');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        companyName: true,
        licenseNo: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  static async login(email: string, passwordText: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await comparePassword(passwordText, user.password);

    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          companyName: true,
          licenseNo: true,
          address: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      const accessToken = generateToken(user);
      return { accessToken };
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  static async changePassword(userId: string, currentPasswordText: string, newPasswordText: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await comparePassword(currentPasswordText, user.password);

    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    const hashedNewPassword = await hashPassword(newPasswordText);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return true;
  }
}
