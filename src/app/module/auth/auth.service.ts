import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { envVars } from '../../config/env';
import { jwtUtils } from '../../utils/jwt';
import AppError from '../../errorHelpers/AppError';
import status from 'http-status';

const registerUser = async (payload: any) => {
    const isExist = await prisma.user.findUnique({ where: { email: payload.email } });
    if (isExist) throw new AppError(status.BAD_REQUEST, 'Email already exists');

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const user = await prisma.user.create({
        data: { ...payload, password: hashedPassword },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

const loginUser = async (payload: any) => {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
    if (!user.isActive) throw new AppError(status.FORBIDDEN, 'Your account is deactivated');
    if (!user.password) throw new AppError(status.BAD_REQUEST, 'Please login with Google');

    const isMatched = await bcrypt.compare(payload.password, user.password);
    if (!isMatched) throw new AppError(status.UNAUTHORIZED, 'Invalid credentials');

    const accessToken = jwtUtils.signToken(
        { userId: user.id, email: user.email, role: user.role, name: user.name },
        envVars.JWT_ACCESS_SECRET,
        envVars.JWT_ACCESS_EXPIRES_IN
    );

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken };
};

const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { _count: { select: { properties: true, investments: true } } },
    });
    if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

const updateProfile = async (userId: string, payload: any) => {
    return await prisma.user.update({
        where: { id: userId },
        data: payload,
    });
};

export const AuthService = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
};
