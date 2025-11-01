import winston from "winston";
import { v4 as uuidv4 } from "uuid";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Middleware: añade requestId y loguea inicio/fin de cada request.
 */
export const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  const start = Date.now();
  logger.info({
    msg: "HTTP request start",
    requestId,
    method: req.method,
    url: req.originalUrl,
  });

  res.on("finish", () => {
    logger.info({
      msg: "HTTP request end",
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
};
