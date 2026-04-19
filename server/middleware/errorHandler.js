const logger   = require('../utils/logger');
const AppError = require('../utils/AppError');

// ── Handle specific Mongoose / JWT errors ────────────────────

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map(e => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`, 409);
};

const handleJWTError = () =>
  new AppError('Invalid token — please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your session has expired — please log in again', 401);

// ── Response formats ─────────────────────────────────────────

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success:    false,
    status:     err.status,
    message:    err.message,
    stack:      err.stack,
    error:      err,
  });
};

const sendErrorProd = (err, res) => {
  // Operational errors — safe to send to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming errors — don't leak details
  logger.error('UNHANDLED ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again.',
  });
};

// ── Global error middleware ──────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  // Log all errors
  const logMsg = `${err.statusCode} ${req.method} ${req.originalUrl} — ${err.message}`;
  if (err.statusCode >= 500) {
    logger.error(logMsg, { stack: err.stack });
  } else {
    logger.warn(logMsg);
  }

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // Production: transform known errors into operational AppErrors
  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  if (err.name === 'CastError')            error = handleCastError(error);
  if (err.name === 'ValidationError')      error = handleValidationError(error);
  if (err.code  === 11000)                 error = handleDuplicateKeyError(error);
  if (err.name === 'JsonWebTokenError')    error = handleJWTError();
  if (err.name === 'TokenExpiredError')    error = handleJWTExpiredError();

  sendErrorProd(error, res);
};

// ── 404 handler ──────────────────────────────────────────────
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

module.exports = { globalErrorHandler, notFoundHandler };
