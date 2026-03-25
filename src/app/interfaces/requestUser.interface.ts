import { Role } from '@prisma/client';

export interface IRequestUser {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      verifiedUser?: IRequestUser;
    }
  }
}
