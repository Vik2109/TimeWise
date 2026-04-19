// Custom error class with status codes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status     = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // vs programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory methods
AppError.badRequest   = (msg) => new AppError(msg, 400);
AppError.unauthorized = (msg) => new AppError(msg || 'Not authorized', 401);
AppError.forbidden    = (msg) => new AppError(msg || 'Access denied', 403);
AppError.notFound     = (msg) => new AppError(msg || 'Resource not found', 404);
AppError.conflict     = (msg) => new AppError(msg, 409);
AppError.server       = (msg) => new AppError(msg || 'Internal server error', 500);

module.exports = AppError;
