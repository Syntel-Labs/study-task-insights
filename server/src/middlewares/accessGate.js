import jwt from "jsonwebtoken";
import { logger } from "./logger.js";

const JWT_SECRET = process.env.ACCESS_TOKEN;
const COOKIE_NAME = "stia_session";

/**
 * Valida sesión JWT o token compartido según configuración.
 */
export const accessGate = (req, res, next) => {
  const enabled = process.env.ACCESS_ENABLED === "true";
  if (!enabled) return next(); // libre si está deshabilitado

  // rutas abiertas (liveness y login/logout)
  if (
    req.path === "/healthz" ||
    req.path === "/gate/login" ||
    req.path === "/gate/logout"
  ) {
    return next();
  }

  const expected = process.env.ACCESS_TOKEN;
  if (!expected) {
    const e = new Error("ACCESS_TOKEN no configurado");
    e.statusCode = 500;
    return next(e);
  }

  // intenta validar sesión desde cookie JWT
  const tokenCookie = req.cookies?.[COOKIE_NAME];
  if (tokenCookie) {
    try {
      jwt.verify(tokenCookie, JWT_SECRET);
      return next(); // sesión válida
    } catch {
      logger.warn({ msg: "JWT expirado o inválido", path: req.path });
    }
  }

  // token directo por header
  const provided = req.header("x-access-token");
  if (provided && provided === expected) return next();

  logger.warn({ msg: "Access denied", path: req.path, method: req.method });
  res.status(401).json({ error: true, message: "Unauthorized" });
};
