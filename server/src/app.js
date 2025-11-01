import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import catalogsRoutes from "#routes/catalogsRoutes.js";
import tasksRoutes from "#routes/tasksRoutes.js";
import taskTagAssignmentsRoutes from "#routes/taskTagAssignmentsRoutes.js";
import studySessionsRoutes from "#routes/studySessionsRoutes.js";
import weeklyProductivityRoutes from "#routes/weeklyProductivityRoutes.js";
import { requestLogger } from "#middlewares/logger.js";
import { errorHandler } from "#middlewares/errorHandler.js";
import { accessGate } from "#middlewares/accessGate.js";

const app = express();
const COOKIE_NAME = "stia_session";

// middlewares globales
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(requestLogger);

// "login-logout" (protección por consumo)
app.post("/gate/login", (req, res) => {
  const expected = process.env.ACCESS_TOKEN;
  const provided = req.body?.secret;

  if (provided !== expected) {
    return res.status(401).json({ error: true, message: "Unauthorized" });
  }

  const hours = Number(process.env.ACCESS_SESSION_HOURS);
  const token = jwt.sign({ access: "ok" }, expected, {
    expiresIn: `${hours}h`,
  });

  res.cookie("stia_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: hours * 60 * 60 * 1000,
  });

  return res.json({ ok: true, message: "Acceso autorizado" });
});

app.post("/gate/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "strict" });
  return res.json({ ok: true, message: "Sesión cerrada" });
});

// gate (protección por consumo)
app.use(accessGate);

// rutas
app.use("/api/catalogs", catalogsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/task-tag-assignments", taskTagAssignmentsRoutes);
app.use("/api/study-sessions", studySessionsRoutes);
app.use("/api/weekly-productivity", weeklyProductivityRoutes);

// monitorear que el servicio este vivo
app.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    service: "study-task-insights-api",
    timestamp: new Date().toISOString(),
    uptimeSec: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

app.use(errorHandler);

export default app;
