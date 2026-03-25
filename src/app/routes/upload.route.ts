import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { cloudinaryUpload } from '../utils/cloudinary';
import { catchAsync } from '../shared/catchAsync';
import { sendResponse } from '../shared/sendResponse';
import status from 'http-status';
import fs from 'fs';
import { checkAuth } from '../middleware/checkAuth';
import { Role } from '@prisma/client';

const router = Router();

router.post(
    '/',
    checkAuth(Role.USER, Role.ADMIN),
    upload.single('image'),
    catchAsync(async (req: Request, res: Response) => {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const url = await cloudinaryUpload.upload(req.file.path);

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: 'Image uploaded successfully',
            data: { url },
        });
    })
);

export const UploadRoutes: Router = router;
