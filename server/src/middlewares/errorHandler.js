import { logger } from "./logger.js";

const STATUS_CODES = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "unprocessable_entity",
  500: "internal_server_error",
  503: "service_unavailable",
};

export const errorHandler = (err, req, res, _next) => {
  const status =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const code = STATUS_CODES[status] ?? "internal_server_error";

  logger.error({
    msg: "Unhandled error",
    requestId: req.requestId,
    status,
    errorName: err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    details: err.details,
  });

  const body = {
    code,
    message: status < 500 ? err.message : "Internal server error",
    requestId: req.requestId,
  };

  if (err.details) body.errors = { details: err.details };

  res.status(status).json(body);
};
