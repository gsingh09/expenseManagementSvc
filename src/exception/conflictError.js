const AppError = require('./appError');
const { HTTP_STATUS_CODES } = require('../constant/constants');

class ConflictError extends AppError {
  constructor(message, errorCode = null) {
    super(message, HTTP_STATUS_CODES.CONFLICT, errorCode);
  }
}

module.exports = ConflictError;
