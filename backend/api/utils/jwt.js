import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token
 * @param {object} payload - User data to include in token
 * @returns {string} - JWT access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'grubgain-api'
  });
}

/**
 * Generate refresh token
 * @param {number} userId - User ID
 * @returns {string} - JWT refresh token
 */
export function generateRefreshToken(userId) {
  const tokenId = uuidv4();

  return jwt.sign(
    { userId, tokenId },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'grubgain-api'
    }
  );
}

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {object} - Decoded token payload
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'grubgain-api'
    });
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {object} - Decoded token payload
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'grubgain-api'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
export function decodeToken(token) {
  return jwt.decode(token);
}
