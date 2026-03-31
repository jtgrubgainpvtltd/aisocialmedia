import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/api/services/ -> backend/
const backendRoot = path.resolve(__dirname, '../..');
const uploadsRoot = path.join(backendRoot, 'public', 'uploads');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function safeExtFromMime(mime = '') {
  if (mime.includes('png')) return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  return '.bin';
}

export async function uploadImage(buffer, folder = 'brand-assets', options = {}) {
  try {
    const subFolder = folder.replace(/\\/g, '/').replace(/\.\./g, '');
    const targetDir = path.join(uploadsRoot, subFolder);
    ensureDir(targetDir);

    const ext = safeExtFromMime(options.mimetype || '');
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const absolutePath = path.join(targetDir, fileName);
    await fs.promises.writeFile(absolutePath, buffer);

    const publicPath = `/uploads/${subFolder}/${fileName}`.replace(/\\/g, '/');

    return {
      url: publicPath,
      secure_url: publicPath,
      public_id: `${subFolder}/${fileName}`,
      size: buffer.length
    };
  } catch (error) {
    logger.error('Local storage upload error', { error: error.message });
    throw new Error('Failed to upload image to local storage');
  }
}

export async function deleteImage(publicId) {
  try {
    if (!publicId) return { result: 'ok' };
    const safePath = publicId.replace(/\\/g, '/').replace(/\.\./g, '');
    const absolutePath = path.join(uploadsRoot, safePath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
    return { result: 'ok' };
  } catch (error) {
    logger.error('Local storage delete error', { error: error.message });
    throw new Error('Failed to delete image from local storage');
  }
}

export async function uploadMultipleImages(buffers, folder = 'brand-assets') {
  return Promise.all(buffers.map(buffer => uploadImage(buffer, folder)));
}

export default { uploadImage, deleteImage, uploadMultipleImages };
