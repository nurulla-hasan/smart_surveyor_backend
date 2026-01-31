import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export const generateToken = (user) => {
    return jwt.sign({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        companyName: user.companyName,
        licenseNo: user.licenseNo,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
};
export const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    });
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};
export const comparePassword = async (password, hashed) => {
    return await bcrypt.compare(password, hashed);
};
//# sourceMappingURL=auth.js.map