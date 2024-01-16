class ApiError extends Error {
  constructor(statusCode, message, errors = [], stackk = "") {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.data = null;
    this.errors = errors;

    if (stackk) {
      this.stack = stackk;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};

export default ApiError;
