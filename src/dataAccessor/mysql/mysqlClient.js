const { Sequelize } = require('sequelize');
const logger = require('../../logger/logger');

let sequelize = null;

const initializeSequelize = (dbConfig) => {
  if (sequelize) {
    return sequelize;
  }

  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: process.env.NODE_ENV === 'test' ? false : msg => logger.debug(msg),
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

  return sequelize;
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Sequelize not initialized. Call initializeSequelize first.');
  }
  return sequelize;
};

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  initializeSequelize,
  getSequelize,
  testConnection
};
