import bcrypt from 'bcrypt';
import prisma from '../../prisma/client.js';
import { generateAccessToken, generateRefreshToken as createRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 10;

/**
 * Generate and save refresh token to database
 */
async function generateAndSaveRefreshToken(userId) {
  const token = createRefreshToken(userId);

  // Calculate expiry (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save to database
  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
      iud_flag: 'I',
      created_by: userId.toString(),
      updated_by: userId.toString()
    }
  });

  return token;
}

/**
 * Register a new restaurant owner
 */
export async function register({ email, password, restaurantName, city, area, cuisineType, targetAudience }) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user and restaurant in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password_hash,
          role: 'RESTAURANT_OWNER',
          status: 'ACTIVE',
          iud_flag: 'I',
          created_by: email,
          updated_by: email
        }
      });

      const restaurant = await tx.restaurant.create({
        data: {
          user_id: user.id,
          name: restaurantName,
          cuisine_type: cuisineType || 'Indian',
          city,
          area: area || null,
          target_audience: targetAudience || null,
          iud_flag: 'I',
          created_by: email,
          updated_by: email
        }
      });

      return { user, restaurant };
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role
    });

    const refreshToken = await generateAndSaveRefreshToken(result.user.id);

    logger.info(`New user registered: ${email}`);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        restaurantName: result.restaurant.name,
        city: result.restaurant.city
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
}

/**
 * Login user
 */
export async function login({ email, password }) {
  try {
    // Find user with restaurant
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        restaurant: true
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = await generateAndSaveRefreshToken(user.id);

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantName: user.restaurant?.name || null,
        city: user.restaurant?.city || null
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        user_id: decoded.userId
      }
    });

    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Check expiry
    if (tokenRecord.expires_at < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Get user for new token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return { accessToken };
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    throw error;
  }
}

/**
 * Logout user - delete ALL refresh tokens
 */
export async function logout(userId) {
  try {
    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { user_id: userId }
    });

    logger.info(`User ${userId} logged out - all tokens deleted`);
    return { success: true };
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_on: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            city: true,
            area: true,
            cuisine_type: true,
            target_audience: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Flatten for frontend
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      restaurantName: user.restaurant?.name || null,
      city: user.restaurant?.city || null,
      restaurantId: user.restaurant?.id || null,
      area: user.restaurant?.area || null,
      cuisineType: user.restaurant?.cuisine_type || null,
    };
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    throw error;
  }
}

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser
};
