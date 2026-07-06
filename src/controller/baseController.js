const logger = require('../logger/logger');

class BaseController {
  constructor(controllerName) {
    this.controllerName = controllerName;
  }

  log(level, message, data = null, requestId = null) {
    const msg = `[${this.controllerName}] ${message}`;
    if (data) {
      logger[level](msg, { requestId, ...data });
    } else {
      logger[level](msg, { requestId });
    }
  }

  logDebug(message, data, requestId) {
    this.log('debug', message, data, requestId);
  }

  logInfo(message, data, requestId) {
    this.log('info', message, data, requestId);
  }

  logWarn(message, data, requestId) {
    this.log('warn', message, data, requestId);
  }

  logError(message, data, requestId) {
    this.log('error', message, data, requestId);
  }

  sendSuccess(res, data, statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      requestId: res.getHeader('X-Request-Id'),
      data
    });
  }

  sendError(res, error) {
    const statusCode = error.statusCode || 500;
    if (error.toJSON) {
      res.status(statusCode).json(error.toJSON());
    } else {
      res.status(statusCode).json({
        error: {
          name: error.name || 'Error',
          message: error.message || 'Internal Server Error',
          statusCode,
          errorCode: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }
}

module.exports = BaseController;
