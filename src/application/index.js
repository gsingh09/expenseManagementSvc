const AppConfigLoader = require('./appConfigLoader');
const { initialize: initializeDb, closeConnection } = require('../dataAccessor/mysql/databaseHandler');
const createApp = require('./app');
const logger = require('../logger/logger');

let server = null;

const start = async () => {
  try {
    logger.info('Starting Expense Management Service...');

    // Load configuration
    const config = new AppConfigLoader();
    logger.info(`Environment: ${config.env}, Port: ${config.port}`);

    // Initialize database
    const dbConfig = config.getDbConfig();
    await initializeDb(dbConfig);

    // Create Express app
    const app = createApp();

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      shutdown();
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeConnection();
      process.exit(0);
    });
  } else {
    await closeConnection();
    process.exit(0);
  }
};

// Start the server
start();

module.exports = { start, shutdown };
