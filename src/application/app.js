const express = require('express');
require('express-async-errors');
const initializeMiddleware = require('../middleware/initializeMiddleware');
const errorHandler = require('../middleware/errorHandler');
const logger = require('../logger/logger');

const createApp = () => {
  const app = express();

  // Initialize middleware
  initializeMiddleware(app);

  // Health check
  app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
  });

  // API routes (to be mounted)
  app.use('/api', require('../route/index'));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        name: 'NotFoundError',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
        errorCode: 'NOT_FOUND'
      }
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app created successfully');
  return app;
};

module.exports = createApp;
