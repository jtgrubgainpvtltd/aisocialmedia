import crypto from 'crypto';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

// SECURITY: Validate encryption key is 64 hex characters (32 bytes for AES-256)
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Use generateKey() to create one.');
}

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypt sensitive data using AES-256-GCM with random IV per encryption
 * SECURITY: GCM mode provides authenticated encryption, preventing tampering
 * Format: iv:authTag:encryptedData (all hex-encoded)
 * 
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format "iv:authTag:ciphertext"
 */
export function encrypt(text) {
  if (!text) return null;

  try {
    // Generate a new random IV for each encryption (CRITICAL for security)
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag for integrity verification
    const authTag = cipher.getAuthTag().toString('hex');

    // Return format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * SECURITY: Verifies authentication tag to detect tampering
 * 
 * @param {string} encryptedText - Encrypted text in format "iv:authTag:ciphertext"
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a cryptographically secure random encryption key for AES-256
 * SECURITY FIX: Generates full 32 bytes (64 hex chars), not truncated
 * 
 * @returns {string} - 64-character hex string (32 bytes)
 */
export function generateKey() {
  return crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex chars
}

/**
 * Generate a random IV (for reference - not needed with GCM auto-generation)
 * @returns {string} - 32-character hex string (16 bytes)
 */
export function generateIV() {
  return crypto.randomBytes(16).toString('hex'); // 16 bytes = 32 hex chars
}
