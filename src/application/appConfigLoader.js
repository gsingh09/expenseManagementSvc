const fs = require('fs');
const path = require('path');
const logger = require('../logger/logger');

const readFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }));
  } catch (error) {
    logger.error(`Failed to read config file: ${filePath}`, error);
    throw error;
  }
};

class AppConfigLoader {
  constructor() {
    this.env = process.env.NODE_ENV || 'local';
    this.port = process.env.NODE_SVC_PORT || 3000;
    this.configFilePath = process.env.CONFIG_FILE || './config/expense-management-svc';

    const configFile = path.resolve(
      `/usr/local/secrets/mysql_expense_secrets.json`
    );

    logger.info(`Loading config from: ${configFile}`);
    this.appConfig = readFile(configFile);
  }

  getPort() {
    return this.port;
  }

  getDbConfig() {
    return this.appConfig.db;
  }
}

module.exports = AppConfigLoader;
