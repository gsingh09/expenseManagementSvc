const logger = require('../logger/logger');
const AppError = require('../exception/appError');

const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  const errorDetails = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
    errorName: err.name,
    errorMessage: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack
  };

  // Log to error.log for alerting and debugging
  if (err instanceof AppError) {
    logger.error(`[${err.name}] ${err.message}`, {
      requestId,
      error: {
        ...errorDetails,
        errorCode: err.errorCode
      }
    });
  } else if (err.isJoi || err.details) {
    logger.error('[ValidationError] Request validation failed', {
      requestId,
      error: {
        ...errorDetails,
        details: err.details || err.message
      }
    });
  } else {
    // Unexpected errors - critical logging
    logger.error('[UnexpectedError] Unhandled error occurred', {
      requestId,
      error: errorDetails
    });
  }

  // If it's an AppError, use its status code
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Joi validation errors
  if (err.isJoi || err.details) {
    const messages = err.details
      ? err.details.map(d => d.message).join(', ')
      : err.message;
    return res.status(400).json({
      error: {
        name: 'ValidationError',
        message: messages,
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        requestId
      }
    });
  }

  // Generic error
  res.status(500).json({
    error: {
      name: err.name || 'Error',
      message: err.message || 'Internal Server Error',
      statusCode: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
      requestId
    }
  });
};

module.exports = errorHandler;
