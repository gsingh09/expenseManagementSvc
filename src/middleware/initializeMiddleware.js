const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('../logger/logger');
const express = require('express');

const initializeMiddleware = (app) => {
  // Security
  app.use(helmet());

  // CORS
  app.use(cors());

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom request logging middleware - logs detailed request info
  app.use((req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store request ID for use in other middleware
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Log incoming request
    const requestLog = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeBody(req.body)
    };

    logger.debug('Incoming Request', { requestId, request: requestLog });

    // Intercept response to log it
    const originalJson = res.json;
    res.json = function(data) {
      const responseTime = Date.now() - startTime;
      const responseLog = {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: JSON.stringify(data).length,
        response: data
      };

      if (res.statusCode >= 400) {
        logger.warn('HTTP Error Response', { requestId, response: responseLog });
      } else {
        logger.debug('Outgoing Response', { requestId, response: responseLog });
      }

      return originalJson.call(this, data);
    };

    next();
  });

  // Custom Morgan token for requestId
  morgan.token('requestId', (req) => req.id || 'unknown');

  // Morgan logging - concise format with requestId
  app.use(
    morgan(
      ':requestId - :remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
      {
        stream: {
          write: message => logger.info(message.trim())
        },
        skip: (req) => {
          // Skip health check endpoints
          return req.url === '/ping';
        }
      }
    )
  );
};

// Sanitize headers to remove sensitive info
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'password'];

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Sanitize request body to remove sensitive data
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = JSON.parse(JSON.stringify(body));
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];

  const redactSensitive = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          redactSensitive(obj[key]);
        }
      });
    }
  };

  redactSensitive(sanitized);
  return sanitized;
}

module.exports = initializeMiddleware;
