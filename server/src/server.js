import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { connectDB, pool } from "#config/db.js";

/**
 * Arranque del servidor HTTP + verificación de conexión a PostgreSQL.
 */
const rawPort = process.env.APP_PORT;
if (!rawPort) {
  console.error("Falta APP_PORT en .env");
  process.exit(1);
}
const PORT = Number(rawPort);
if (Number.isNaN(PORT)) {
  console.error("APP_PORT inválido (no es numérico)");
  process.exit(1);
}

const server = http.createServer(app);

const start = async () => {
  // Verifica conexión a DB (pg)
  await connectDB();

  server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  });
};

// Apagado controlado
const shutdown = async (signal) => {
  try {
    console.log(`\n🔻 Recibido ${signal}, cerrando servidor...`);
    server.close(async () => {
      console.log("🛑 HTTP server cerrado.");
      try {
        await pool.end();
        console.log("🔌 Pool de PostgreSQL cerrado.");
      } finally {
        process.exit(0);
      }
    });

    // Forzar cierre si cuelga
    setTimeout(async () => {
      console.warn("⏱️ Forzando cierre...");
      try {
        await pool.end();
      } finally {
        process.exit(1);
      }
    }, 5000).unref();
  } catch (e) {
    console.error("❌ Error al cerrar:", e);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

start();
