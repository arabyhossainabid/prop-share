import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { envVars as config } from '../config/env';
import '../interfaces/requestUser.interface';

const checkAuthOptional = (req: Request, res: Response, next: NextFunction) => {
  const token =
    req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

  if (!token) {
    return next(); // Proceed without user info
  }

  try {
    const verified = jwt.verify(token, config.JWT_ACCESS_SECRET as string) as any;
    req.verifiedUser = verified;
  } catch (error) {
    // Optionally ignore the error to let it proceed as anonymous
  }

  next();
};

export default checkAuthOptional;
