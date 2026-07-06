const AppError = require('./appError');
const { HTTP_STATUS_CODES } = require('../constant/constants');

class InternalServerError extends AppError {
  constructor(message, errorCode = null) {
    super(message, HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, errorCode);
  }
}

module.exports = InternalServerError;
