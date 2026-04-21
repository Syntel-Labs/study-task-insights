import prisma from "#config/prismaClient.js";

export const findMany = ({ where, include, orderBy, take, skip }) =>
  prisma.task.findMany({ where, include, orderBy, take, skip });

export const count = (where) => prisma.task.count({ where });

export const findById = (taskId, include) =>
  prisma.task.findUnique({ where: { taskId: String(taskId) }, include });

export const create = (data) => prisma.task.create({ data });

export const update = (taskId, data) =>
  prisma.task.update({ where: { taskId: String(taskId) }, data });

export const remove = (taskId) =>
  prisma.task.delete({ where: { taskId: String(taskId) } });

export const transaction = (ops) => prisma.$transaction(ops);
