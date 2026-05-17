class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, code) {
    return new AppError(msg, 400, code);
  }

  static unauthorized(msg, code) {
    return new AppError(msg, 401, code);
  }

  static forbidden(msg, code) {
    return new AppError(msg, 403, code);
  }

  static notFound(msg, code) {
    return new AppError(msg, 404, code);
  }

  static conflict(msg, code) {
    return new AppError(msg, 409, code);
  }

  static unprocessable(msg, code) {
    return new AppError(msg, 422, code);
  }

  static internal(msg, code) {
    return new AppError(msg, 500, code);
  }
}

module.exports = AppError;
