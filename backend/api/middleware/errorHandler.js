import { logger } from '../utils/logger.js';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    if (err.code === 'P2002') {
      message = `Duplicate value for ${err.meta?.target?.[0] || 'field'}`;
    } else if (err.code === 'P2025') {
      message = 'Record not found';
      statusCode = 404;
    } else if (err.code === 'P2003') {
      message = 'Foreign key constraint failed';
    } else {
      message = 'Database error occurred';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected field in file upload';
    } else {
      message = 'File upload error';
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

export default errorHandler;
