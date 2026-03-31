import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../../prisma/client.js';

/**
 * Authentication middleware - Verifies JWT token
 * Attaches user object to req.user if valid
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        restaurant: {
          select: { id: true, name: true, city: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is not active' }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: error.message || 'Invalid token' }
    });
  }
};

/**
 * Authorization middleware - Check if user has required role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    next();
  };
};

/**
 * Optional authentication - Does not fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          restaurant: { select: { id: true, name: true, city: true } }
        }
      });

      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail - user remains unauthenticated
  }

  next();
};

export default { authenticate, authorize, optionalAuth };
