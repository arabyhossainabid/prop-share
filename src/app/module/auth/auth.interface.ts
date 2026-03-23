import { Role } from '@prisma/client';

export interface ILoginUserResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: Role;
        avatar: string | null;
    };
}
