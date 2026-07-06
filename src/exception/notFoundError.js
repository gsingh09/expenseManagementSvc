const AppError = require('./appError');
const { HTTP_STATUS_CODES } = require('../constant/constants');

class NotFoundError extends AppError {
  constructor(message, errorCode = null) {
    super(message, HTTP_STATUS_CODES.NOT_FOUND, errorCode);
  }
}

module.exports = NotFoundError;
