const AppError = require('./appError');
const { HTTP_STATUS_CODES } = require('../constant/constants');

class BadRequestError extends AppError {
  constructor(message, errorCode = null) {
    super(message, HTTP_STATUS_CODES.BAD_REQUEST, errorCode);
  }
}

module.exports = BadRequestError;
