const logger = require('../logger/logger');

class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  log(level, message, data = null) {
    const msg = `[${this.serviceName}] ${message}`;
    if (data) {
      logger[level](msg, data);
    } else {
      logger[level](msg);
    }
  }

  logDebug(message, data) {
    this.log('debug', message, data);
  }

  logInfo(message, data) {
    this.log('info', message, data);
  }

  logWarn(message, data) {
    this.log('warn', message, data);
  }

  logError(message, data) {
    this.log('error', message, data);
  }
}

module.exports = BaseService;
