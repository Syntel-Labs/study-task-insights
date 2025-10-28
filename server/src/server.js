import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import prisma from "#config/prismaClient.js";

/**
 * Arranque del servidor HTTP + verificación de conexión a PostgreSQL (vía Prisma)
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
let isShuttingDown = false;

/**
 * Test de conexión inicial a PostgreSQL mediante Prisma.
 * Ejecuta una simple consulta SELECT NOW() para validar conexión.
 */
const testPrismaConnection = async () => {
  try {
    const [{ now }] = await prisma.$queryRaw`SELECT NOW()`;
    console.log(`✅ Prisma conectado a PostgreSQL: ${now}`);
  } catch (err) {
    console.error("❌ Error al conectar con PostgreSQL vía Prisma:", err);
    process.exit(1);
  }
};

/**
 * Inicialización principal del servidor HTTP.
 */
const start = async () => {
  await testPrismaConnection();

  server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  });
};

/**
 * Apagado controlado del servidor y cierre de conexiones.
 * Evita dobles invocaciones con bandera de seguridad.
 */
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    console.log(`\n🔻 Recibido ${signal}, cerrando servidor...`);
    server.close(async () => {
      console.log("🛑 HTTP server cerrado.");
      try {
        await prisma.$disconnect();
        console.log("🔌 Prisma desconectado.");
      } finally {
        process.exit(0);
      }
    });

    // Forzar cierre en caso de bloqueo o espera prolongada
    setTimeout(async () => {
      console.warn("⏱️ Forzando cierre...");
      try {
        await prisma.$disconnect();
      } finally {
        process.exit(1);
      }
    }, 5000).unref();
  } catch (e) {
    console.error("❌ Error al cerrar:", e);
    process.exit(1);
  }
};

/**
 * Manejadores globales de señales y errores no controlados.
 */
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

start();
