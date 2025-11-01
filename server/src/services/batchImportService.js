import prisma from "#config/prismaClient.js";

/** Valida que startedAt y endedAt sean fechas válidas y coherentes */
const ensureValidTimes = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) {
    const e = new Error("startedAt y endedAt son obligatorios");
    e.statusCode = 400;
    throw e;
  }
  const s = new Date(startedAt);
  const en = new Date(endedAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) {
    const e = new Error("Fechas inválidas en startedAt/endedAt");
    e.statusCode = 400;
    throw e;
  }
  if (en < s) {
    const e = new Error("endedAt debe ser mayor o igual que startedAt");
    e.statusCode = 400;
    throw e;
  }
};

/**
 * Importa un batch de tasks, assignments y sessions.
 * - Resuelve referencias temporales taskRef -> taskId
 * - Valida integridad de FK y unicidad
 * - Usa transacción para consistencia
 */
export const importBatch = async ({
  tasks = [],
  assignments = [],
  sessions = [],
}) => {
  if (!tasks.length && !assignments.length && !sessions.length) {
    const e = new Error("Body vacío");
    e.statusCode = 400;
    throw e;
  }

  return await prisma.$transaction(async (tx) => {
    // Crear tasks y mapear clientId -> taskId
    const taskIdMap = new Map();
    for (const t of tasks) {
      const { clientId, taskId, createdAt, updatedAt, ...data } = t;
      const created = await tx.task.create({ data });
      if (clientId) taskIdMap.set(String(clientId), created.taskId);
    }

    // Crear assignments y resolver taskRef -> taskId
    for (const a of assignments) {
      const { taskRef, taskId, createdAt, ...rest } = a;
      const resolvedTaskId = taskRef ? taskIdMap.get(String(taskRef)) : taskId;
      if (!resolvedTaskId) {
        const e = new Error(`taskRef no resuelto: ${taskRef}`);
        e.statusCode = 400;
        throw e;
      }
      try {
        await tx.taskTagAssignment.create({
          data: { ...rest, taskId: resolvedTaskId },
        });
      } catch (err) {
        if (err.code === "P2003") {
          const e = new Error(
            "Violación de clave foránea (FK) en assignments. Verifica taskTagId/taskId."
          );
          e.statusCode = 409;
          e.details = err.meta;
          throw e;
        }
        if (err.code === "P2002") {
          const e = new Error("Duplicado en assignments (taskId + taskTagId).");
          e.statusCode = 409;
          e.details = err.meta;
          throw e;
        }
        throw err;
      }
    }

    // Crear sessions y resolver taskRef -> taskId
    for (const s of sessions) {
      const { taskRef, taskId, createdAt, durationMinutes, ...rest } = s;
      const resolvedTaskId = taskRef ? taskIdMap.get(String(taskRef)) : taskId;
      if (!resolvedTaskId) {
        const e = new Error(`taskRef no resuelto: ${taskRef}`);
        e.statusCode = 400;
        throw e;
      }
      ensureValidTimes(rest.startedAt, rest.endedAt);
      try {
        await tx.studySession.create({
          data: { ...rest, taskId: resolvedTaskId },
        });
      } catch (err) {
        if (err.code === "P2003") {
          const e = new Error(
            "Violación de clave foránea (FK) en sessions. Verifica taskId."
          );
          e.statusCode = 409;
          e.details = err.meta;
          throw e;
        }
        throw err;
      }
    }

    return {
      ok: true,
      created: {
        tasks: tasks.length,
        assignments: assignments.length,
        sessions: sessions.length,
      },
      taskIdMap: Object.fromEntries(taskIdMap),
    };
  });
};
