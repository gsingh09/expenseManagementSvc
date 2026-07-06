const { initializeSequelize, getSequelize, testConnection } = require('./mysqlClient');
const { loadModels } = require('./models/index');
const logger = require('../../logger/logger');

let isInitialized = false;

const initialize = async (dbConfig) => {
  if (isInitialized) {
    return getSequelize();
  }

  try {
    // Initialize Sequelize
    initializeSequelize(dbConfig);

    // Load all models
    loadModels();

    // Test connection
    await testConnection();

    // Sync models with database
    const sequelize = getSequelize();
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: process.env.NODE_ENV === 'test' });
      logger.info('Database models synchronized');
    }

    isInitialized = true;
    return sequelize;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

const getDb = () => {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return getSequelize();
};

const closeConnection = async () => {
  if (isInitialized) {
    const sequelize = getSequelize();
    await sequelize.close();
    isInitialized = false;
    logger.info('Database connection closed');
  }
};

module.exports = {
  initialize,
  getDb,
  closeConnection
};
