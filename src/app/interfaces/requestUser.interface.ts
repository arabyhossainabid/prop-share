import { Role } from '@prisma/client';

export interface IRequestUser {
    userId: string;
    email: string;
    role: Role;
    name: string;
}

// Rename the property to avoid conflict with Passport
declare global {
    namespace Express {
        interface Request {
            verifiedUser?: IRequestUser;
        }
    }
}
