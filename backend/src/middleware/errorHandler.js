const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code = 'INTERNAL_ERROR' } = err;

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry — this record already exists';
    code = 'DUPLICATE_ENTRY';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record not found';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid data format';
    code = 'INVALID_FORMAT';
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.error('Error:', { message: err.message, stack: err.stack, code: err.code });
  } else {
    logger.error('Error:', { message, statusCode });
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, notFound, asyncHandler };
