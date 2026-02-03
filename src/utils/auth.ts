import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateToken = (user: any) => {
  return jwt.sign(
    { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      phone: user.phone,
      companyName: user.companyName,
      licenseNo: user.licenseNo,
      address: user.address,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }, 
    process.env.JWT_SECRET!, 
    {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || '15m'
    }
  );
};

export const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as any) || '7d'
  });
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashed: string) => {
  return await bcrypt.compare(password, hashed);
};
