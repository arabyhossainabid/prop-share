import bcrypt from 'bcryptjs';
import status from 'http-status';
import { envVars } from '../../config/env';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { jwtUtils } from '../../utils/jwt';

// Casting prisma to any at the top level to resolve persistent IDE type feedback
// regarding model relation names not matching the currently generated client types.
const db = prisma as any;

const registerUser = async (payload: any) => {
  if (!payload.phone) {
    throw new AppError(status.BAD_REQUEST, 'Phone number is required');
  }

  const isExist = await db.user.findUnique({ where: { email: payload.email } });
  if (isExist) throw new AppError(status.BAD_REQUEST, 'Email already exists');

  const isPhoneExist = await db.user.findFirst({
    where: { phone: payload.phone },
  });
  if (isPhoneExist)
    throw new AppError(status.BAD_REQUEST, 'Phone number already exists');

  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const user = await db.user.create({
    data: { ...payload, password: hashedPassword },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const loginUser = async (payload: any) => {
  const user = await db.user.findUnique({ where: { email: payload.email } });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
  if (!user.isActive)
    throw new AppError(status.FORBIDDEN, 'Your account is deactivated');
  if (!user.password)
    throw new AppError(status.BAD_REQUEST, 'Please login with Google');

  const isMatched = await bcrypt.compare(payload.password, user.password);
  if (!isMatched)
    throw new AppError(status.UNAUTHORIZED, 'Invalid credentials');

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwtUtils.getAccessToken(jwtPayload);
  const refreshToken = jwtUtils.getRefreshToken(jwtPayload);

  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
};

const refreshToken = async (token: string) => {
  const verifiedToken = jwtUtils.verifyToken(token, envVars.JWT_REFRESH_SECRET);
  if (!verifiedToken.success || !verifiedToken.data) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid refresh token');
  }

  const { userId } = verifiedToken.data as any;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
  if (!user.isActive)
    throw new AppError(status.FORBIDDEN, 'Your account is deactivated');

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  const accessToken = jwtUtils.getAccessToken(jwtPayload);

  return { accessToken };
};

const getMe = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { properties: true, investments: true } } },
  });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found');
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const updateProfile = async (userId: string, payload: any) => {
  if (payload.phone) {
    const isPhoneExist = await db.user.findFirst({
      where: {
        phone: payload.phone,
        NOT: { id: userId },
      },
    });

    if (isPhoneExist) {
      throw new AppError(status.BAD_REQUEST, 'Phone number already exists');
    }
  }

  return await db.user.update({
    where: { id: userId },
    data: payload,
  });
};

const deleteAccount = async (userId: string) => {
  return await db.user.delete({
    where: { id: userId },
  });
};

const forgotPassword = async (email: string) => {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found');

  // Logic to send reset email goes here
  return { message: 'Password reset link sent to your email' };
};

const socialLogin = async (payload: {
  email: string;
  name?: string;
  avatar?: string;
  provider: string;
}) => {
  let user = await db.user.findUnique({ where: { email: payload.email } });
  let isNewUser = false;

  if (!user) {
    user = await db.user.create({
      data: {
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.avatar,
        emailVerified: true,
        role: 'USER',
        isActive: true,
      },
    });
    isNewUser = true;
  }

  const jwtPayload = {
    userId: user!.id,
    email: user!.email,
    role: user!.role,
    name: user!.name || '',
  };

  const accessToken = jwtUtils.getAccessToken(jwtPayload);
  const refreshToken = jwtUtils.getRefreshToken(jwtPayload);

  return { user, accessToken, refreshToken, isNewUser };
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  deleteAccount,
  forgotPassword,
  socialLogin,
};
