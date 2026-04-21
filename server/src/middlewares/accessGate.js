import jwt from "jsonwebtoken";
import crypto from "crypto";
import { logger } from "./logger.js";

const COOKIE_NAME = "stia_session";

export const accessGate = (req, res, next) => {
  const enabled = process.env.ACCESS_ENABLED === "true";
  if (!enabled) return next();

  const expected = process.env.ACCESS_TOKEN;
  if (!expected) {
    const e = new Error("ACCESS_TOKEN not configured");
    e.statusCode = 500;
    return next(e);
  }

  const tokenCookie = req.cookies?.[COOKIE_NAME];
  if (tokenCookie) {
    try {
      jwt.verify(tokenCookie, expected);
      return next();
    } catch {
      logger.warn({ msg: "Expired or invalid JWT", path: req.path });
    }
  }

  const provided = req.header("x-access-token") ?? "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (
    providedBuf.length > 0 &&
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return next();
  }

  logger.warn({ msg: "Access denied", path: req.path, method: req.method });
  res
    .status(401)
    .json({ code: "unauthorized", message: "Unauthorized" });
};
