import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
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
      }
    });

    const { password, ...userWithoutPassword } = user;
    const token = generateToken(user.id, user.role);

    return { user: userWithoutPassword, token };
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

    const { password, ...userWithoutPassword } = user;
    const token = generateToken(user.id, user.role);

    return { user: userWithoutPassword, token };
  }
}
