class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "test" && statusCode === 500) {
    console.error("Unhandled Error:", err);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
};
export {
  AppError,
  asyncHandler,
  errorHandler
};
