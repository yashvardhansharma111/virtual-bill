import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary configuration
 * Handles image uploads to Cloudinary
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Folder path in Cloudinary
 * @returns Upload result with secure URL
 */
export async function uploadImage(file: string | Buffer, folder: string = 'virtualbill/products'): Promise<string> {
  try {
    const uploadResult = await cloudinary.uploader.upload(file as string, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    return uploadResult.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete image from Cloudinary
 * @param imageUrl - Full URL of the image to delete
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from URL
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw error, just log it
  }
}

export default cloudinary;
