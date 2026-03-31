import * as authService from '../services/authService.js';
import { body, validationResult } from 'express-validator';

/**
 * Register new restaurant owner
 * POST /api/v1/auth/register
 */
export const register = [
  // Validation rules
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('restaurantName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Restaurant name must be 2-100 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),

  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { email, password, restaurantName, city, area, cuisineType, targetAudience } = req.body;

      const result = await authService.register({
        email,
        password,
        restaurantName,
        city,
        area,
        cuisineType,
        targetAudience
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  }
];

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token not provided' }
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware

    await authService.logout(userId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  getMe
};
