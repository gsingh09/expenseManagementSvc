const AppError = require('./appError');
const { HTTP_STATUS_CODES } = require('../constant/constants');

class ForbiddenError extends AppError {
  constructor(message, errorCode = null) {
    super(message, HTTP_STATUS_CODES.FORBIDDEN, errorCode);
  }
}

module.exports = ForbiddenError;
