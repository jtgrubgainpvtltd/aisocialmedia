import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';
import { logger } from '../utils/logger.js';

/**
 * Upload image to Cloudinary from buffer
 * @param {Buffer} buffer - Image file buffer
 * @param {string} folder - Cloudinary folder path (default: 'brand-assets')
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} - Upload result with URL and metadata
 */
export async function uploadImage(buffer, folder = 'brand-assets', options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `grubgain/${folder}`,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image to Cloudinary'));
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<object>} - Deletion result
 */
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new Error('Failed to delete image from Cloudinary');
    }

    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Upload multiple images
 * @param {Array<Buffer>} buffers - Array of image buffers
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<Array<object>>} - Array of upload results
 */
export async function uploadMultipleImages(buffers, folder = 'brand-assets') {
  const uploadPromises = buffers.map(buffer => uploadImage(buffer, folder));
  return Promise.all(uploadPromises);
}

/**
 * Get image details from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} - Image details
 */
export async function getImageDetails(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    logger.error('Cloudinary get details error:', error);
    throw new Error('Failed to get image details from Cloudinary');
  }
}
