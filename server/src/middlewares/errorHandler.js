import { logger } from "./logger.js";

export const errorHandler = (err, req, res, _next) => {
  const status =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  logger.error({
    msg: "Unhandled error",
    requestId: req.requestId,
    status,
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    details: err.details,
  });

  res.status(status).json({
    error: true,
    message: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
};
