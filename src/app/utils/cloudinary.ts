import { v2 as cloudinary } from 'cloudinary';
import { envVars } from '../config/env';

const getCloudinaryErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      message?: string;
      error?: { message?: string };
      http_code?: number;
      name?: string;
    };

    const innerMessage = maybeError.error?.message;
    const outerMessage = maybeError.message;
    const statusSuffix = maybeError.http_code
      ? ` (http_code: ${maybeError.http_code})`
      : '';

    if (innerMessage) return `${innerMessage}${statusSuffix}`;
    if (outerMessage) return `${outerMessage}${statusSuffix}`;
    if (maybeError.name) return `${maybeError.name}${statusSuffix}`;
  }

  return 'Unknown Cloudinary error';
};

if (
  !envVars.CLOUDINARY.CLOUD_NAME ||
  !envVars.CLOUDINARY.API_KEY ||
  !envVars.CLOUDINARY.API_SECRET
) {
  console.error(
    '[Cloudinary] Missing CLOUDINARY_* env vars. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
  );
}

cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUD_NAME,
  api_key: envVars.CLOUDINARY.API_KEY,
  api_secret: envVars.CLOUDINARY.API_SECRET,
});

if (envVars.NODE_ENV === 'development') {
  console.log('[Cloudinary] Config loaded:', {
    cloudName: envVars.CLOUDINARY.CLOUD_NAME,
    apiKeyPresent: Boolean(envVars.CLOUDINARY.API_KEY),
    apiSecretPresent: Boolean(envVars.CLOUDINARY.API_SECRET),
  });
}

export const cloudinaryUpload = {
  upload: async (path: string, folder: string = 'propshare') => {
    if (
      !envVars.CLOUDINARY.CLOUD_NAME ||
      !envVars.CLOUDINARY.API_KEY ||
      !envVars.CLOUDINARY.API_SECRET
    ) {
      throw new Error(
        'Cloudinary configuration missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
      );
    }

    try {
      const result = await cloudinary.uploader.upload(path, {
        folder: folder,
        resource_type: 'auto',
      });
      return result.secure_url;
    } catch (error) {
      const message = getCloudinaryErrorMessage(error);
      console.error('Cloudinary upload error:', message, error);
      throw new Error(message);
    }
  },

  uploadBuffer: async (
    fileBuffer: Buffer,
    folder: string = 'propshare'
  ): Promise<string> => {
    if (
      !envVars.CLOUDINARY.CLOUD_NAME ||
      !envVars.CLOUDINARY.API_KEY ||
      !envVars.CLOUDINARY.API_SECRET
    ) {
      throw new Error(
        'Cloudinary configuration missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
      );
    }

    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) {
            const message = getCloudinaryErrorMessage(error);
            console.error('Cloudinary upload error:', message, error);
            reject(new Error(message));
            return;
          }

          if (!result?.secure_url) {
            reject(new Error('Cloudinary did not return secure_url'));
            return;
          }

          resolve(result.secure_url);
        }
      );

      uploadStream.end(fileBuffer);
    });
  },
};
