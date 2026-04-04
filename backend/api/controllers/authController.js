import * as authService from '../services/authService.js';
import { body, validationResult } from 'express-validator';

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const allowedSameSite = new Set(['strict', 'lax', 'none']);
const configuredSameSite = (process.env.AUTH_COOKIE_SAMESITE || 'lax').toLowerCase();
const cookieSameSite = allowedSameSite.has(configuredSameSite) ? configuredSameSite : 'lax';
const cookieSecure = process.env.AUTH_COOKIE_SECURE
  ? process.env.AUTH_COOKIE_SECURE === 'true'
  : process.env.NODE_ENV === 'production';

const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
  maxAge: REFRESH_COOKIE_MAX_AGE,
});

const normalizeAuthError = (error) => {
  const message = error?.message || '';
  if (error?.statusCode) return error;

  if (
    message === 'Invalid email or password' ||
    message === 'Invalid refresh token' ||
    message === 'Refresh token expired' ||
    message === 'Refresh token not provided' ||
    message === 'User not found'
  ) {
    error.statusCode = 401;
    return error;
  }

  if (message === 'Account is not active') {
    error.statusCode = 403;
    return error;
  }

  if (message === 'Registration failed. Please check your details.') {
    error.statusCode = 409;
    return error;
  }

  return error;
};

/**
 * Register new restaurant owner
 * POST /api/v1/auth/register
 */
export const register = [
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
      next(normalizeAuthError(error));
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

      res.cookie('refreshToken', result.refreshToken, buildRefreshCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user
        }
      });
    } catch (error) {
      next(normalizeAuthError(error));
    }
  }
];

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 * SECURITY: Implements refresh token rotation
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

    res.cookie('refreshToken', result.refreshToken, buildRefreshCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    next(normalizeAuthError(error));
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await authService.logout(userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
    });

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
