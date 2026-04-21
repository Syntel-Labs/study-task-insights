import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import gateRoutes from "#routes/gateRoutes.js";
import catalogsRoutes from "#routes/catalogsRoutes.js";
import tasksRoutes from "#routes/tasksRoutes.js";
import taskTagAssignmentsRoutes from "#routes/taskTagAssignmentsRoutes.js";
import studySessionsRoutes from "#routes/studySessionsRoutes.js";
import weeklyProductivityRoutes from "#routes/weeklyProductivityRoutes.js";
import batchImportRoutes from "#routes/batchImportRoutes.js";
import llmRoutes from "#routes/llmRoutes.js";

import { requestLogger } from "#middlewares/logger.js";
import { errorHandler } from "#middlewares/errorHandler.js";
import { accessGate } from "#middlewares/accessGate.js";

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(requestLogger);

app.use("/gate", gateRoutes);

app.use(accessGate);

app.use("/api/v1/catalogs", catalogsRoutes);
app.use("/api/v1/tasks", tasksRoutes);
app.use("/api/v1/task-tag-assignments", taskTagAssignmentsRoutes);
app.use("/api/v1/study-sessions", studySessionsRoutes);
app.use("/api/v1/weekly-productivity", weeklyProductivityRoutes);
app.use("/api/v1/import/batch", batchImportRoutes);
app.use("/api/v1/llm", llmRoutes);

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
