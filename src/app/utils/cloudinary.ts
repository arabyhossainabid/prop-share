import { v2 as cloudinary } from 'cloudinary';
import { envVars } from '../config/env';

cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUD_NAME,
    api_key: envVars.CLOUDINARY.API_KEY,
    api_secret: envVars.CLOUDINARY.API_SECRET,
});

export const cloudinaryUpload = {
    upload: async (path: string, folder: string = 'propshare') => {
        try {
            const result = await cloudinary.uploader.upload(path, {
                folder: folder,
                resource_type: 'auto',
            });
            return result.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    },
};
