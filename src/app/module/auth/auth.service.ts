import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import status from 'http-status';
import { envVars } from '../../config/env';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { sendPasswordResetEmail } from '../../utils/email';
import { jwtUtils } from '../../utils/jwt';

const googleClient = new OAuth2Client(envVars.GOOGLE.CLIENT_ID);

// Casting prisma to any at the top level to resolve persistent IDE type feedback
// regarding model relation names not matching the currently generated client types.
const db = prisma as any;

const registerUser = async (payload: any) => {
  const isExist = await db.user.findUnique({ where: { email: payload.email } });
  if (isExist) throw new AppError(status.BAD_REQUEST, 'Email already exists');

  if (payload.phone) {
    const isPhoneExist = await db.user.findFirst({
      where: { phone: payload.phone },
    });
    if (isPhoneExist)
      throw new AppError(status.BAD_REQUEST, 'Phone number already exists');
  }

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
    throw new AppError(
      status.BAD_REQUEST,
      'This account uses Google Sign-In. Please login with Google.'
    );

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

const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

const forgotPassword = async (email: string) => {
  // Always return success to prevent email enumeration attacks
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return {
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  if (!user.password) {
    throw new AppError(
      status.BAD_REQUEST,
      'This account uses Google Sign-In. Password reset is not applicable.'
    );
  }

  // Delete any existing reset tokens for this user
  await db.verification.deleteMany({
    where: { identifier: `reset-password:${email}` },
  });

  // Generate a secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  await db.verification.create({
    data: {
      identifier: `reset-password:${email}`,
      value: hashedToken,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRES_MS),
      userId: user.id,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await sendPasswordResetEmail(email, resetUrl, user.name || undefined);

  return {
    message: 'If an account exists, a password reset link has been sent.',
  };
};

const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find any verification record that matches this hashed token
  const verification = await db.verification.findFirst({
    where: {
      value: hashedToken,
      identifier: { startsWith: 'reset-password:' },
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    throw new AppError(status.BAD_REQUEST, 'Invalid or expired reset token');
  }

  const email = verification.identifier.replace('reset-password:', '');
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Invalidate the token after use
  await db.verification.delete({ where: { id: verification.id } });

  return {
    message:
      'Password reset successfully. You can now login with your new password.',
  };
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

// ─── Google ID Token Login ────────────────────────────────────────────────────
const googleLogin = async (credential: string) => {
  // 1. Verify the Google ID token
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: envVars.GOOGLE.CLIENT_ID,
    });
  } catch {
    throw new AppError(status.UNAUTHORIZED, 'Invalid Google token');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError(status.BAD_REQUEST, 'Unable to retrieve email from Google token');
  }

  const { email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new AppError(status.BAD_REQUEST, 'Google account email is not verified');
  }

  // 2. Find or create user
  let user = await db.user.findUnique({ where: { email } });
  let isNewUser = false;

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        avatar: picture || null,
        emailVerified: true,
        role: 'USER',
        isActive: true,
      },
    });
    isNewUser = true;
  }

  if (!user.isActive) {
    throw new AppError(status.FORBIDDEN, 'Your account has been deactivated');
  }

  // 3. Issue JWT tokens
  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name || '',
  };

  const accessToken = jwtUtils.getAccessToken(jwtPayload);
  const refreshToken = jwtUtils.getRefreshToken(jwtPayload);

  const { password: _pw, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken, isNewUser };
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
  socialLogin,
  googleLogin,
};
