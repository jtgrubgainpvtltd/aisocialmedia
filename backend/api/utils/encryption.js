import crypto from 'crypto';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
}
if (!process.env.ENCRYPTION_IV || process.env.ENCRYPTION_IV.length !== 16) {
  throw new Error('ENCRYPTION_IV must be exactly 16 characters');
}

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV = process.env.ENCRYPTION_IV;

/**
 * Encrypt sensitive data (API keys, tokens, etc.)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in hex format
 */
export function encrypt(text) {
  if (!text) return null;

  try {
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      Buffer.from(IV)
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    logger.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Encrypted text in hex format
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      Buffer.from(IV)
    );

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key
 * @param {number} length - Key length (default: 32 for AES-256)
 * @returns {string} - Random hex string
 */
export function generateKey(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate a random IV
 * @returns {string} - Random 16-character string
 */
export function generateIV() {
  return crypto.randomBytes(16).toString('hex').slice(0, 16);
}
