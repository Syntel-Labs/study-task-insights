import * as batchRepo from "#repositories/batchImportRepository.js";

const ensure_valid_times = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) {
    const e = new Error("startedAt and endedAt are required");
    e.statusCode = 400;
    throw e;
  }
  const s = new Date(startedAt);
  const en = new Date(endedAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) {
    const e = new Error("Invalid dates in startedAt/endedAt");
    e.statusCode = 400;
    throw e;
  }
  if (en < s) {
    const e = new Error("endedAt must be greater than or equal to startedAt");
    e.statusCode = 400;
    throw e;
  }
};

export const importBatch = async ({ tasks = [], assignments = [], sessions = [] }) => {
  if (!tasks.length && !assignments.length && !sessions.length) {
    const e = new Error("Empty body");
    e.statusCode = 400;
    throw e;
  }

  return batchRepo.transaction(async (tx) => {
    const taskIdMap = new Map();

    for (const t of tasks) {
      const { clientId, taskId: _taskId, createdAt: _ca, updatedAt: _ua, ...data } = t;
      const created = await tx.task.create({ data });
      if (clientId) taskIdMap.set(String(clientId), created.taskId);
    }

    for (const a of assignments) {
      const { taskRef, taskId, createdAt: _ca, ...rest } = a;
      const resolvedTaskId = taskRef ? taskIdMap.get(String(taskRef)) : taskId;
      if (!resolvedTaskId) {
        const e = new Error(`Unresolved taskRef: ${taskRef}`);
        e.statusCode = 400;
        throw e;
      }
      try {
        await tx.taskTagAssignment.create({ data: { ...rest, taskId: resolvedTaskId } });
      } catch (err) {
        if (err.code === "P2003") {
          const e = new Error("Foreign key violation in assignments. Check taskTagId/taskId.");
          e.statusCode = 409;
          e.details = err.meta;
          throw e;
        }
        if (err.code === "P2002") {
          const e = new Error("Duplicate assignment (taskId + taskTagId).");
          e.statusCode = 409;
          e.details = err.meta;
          throw e;
        }
        throw err;
      }
    }

    for (const s of sessions) {
      const { taskRef, taskId, createdAt: _ca, durationMinutes: _dm, ...rest } = s;
      const resolvedTaskId = taskRef ? taskIdMap.get(String(taskRef)) : taskId;
      if (!resolvedTaskId) {
        const e = new Error(`Unresolved taskRef: ${taskRef}`);
        e.statusCode = 400;
        throw e;
      }
      ensure_valid_times(rest.startedAt, rest.endedAt);
      try {
        await tx.studySession.create({ data: { ...rest, taskId: resolvedTaskId } });
      } catch (err) {
        if (err.code === "P2003") {
          const e = new Error("Foreign key violation in sessions. Check taskId.");
          e.statusCode = 409;
          e.details = err.meta;
          throw e;
        }
        throw err;
      }
    }

    return {
      created: { tasks: tasks.length, assignments: assignments.length, sessions: sessions.length },
      taskIdMap: Object.fromEntries(taskIdMap),
    };
  });
};
