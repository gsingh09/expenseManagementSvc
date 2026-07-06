const AppError = require('./appError');
const { HTTP_STATUS_CODES } = require('../constant/constants');

class UnauthorizedError extends AppError {
  constructor(message, errorCode = null) {
    super(message, HTTP_STATUS_CODES.UNAUTHORIZED, errorCode);
  }
}

module.exports = UnauthorizedError;
