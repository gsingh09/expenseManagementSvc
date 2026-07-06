class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        errorCode: this.errorCode
      }
    };
  }
}

module.exports = AppError;
