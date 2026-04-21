import prisma from "#config/prismaClient.js";

/**
 * Returns the Prisma model delegate for a given catalog entity name.
 * Centralizes entity-to-model mapping outside the service layer.
 */
export const modelFor = (entity) => {
  const map = {
    terms: prisma.term,
    "task-statuses": prisma.taskStatus,
    "task-priorities": prisma.taskPriority,
    "task-types": prisma.taskType,
    "task-tags": prisma.taskTag,
  };
  return map[entity] ?? null;
};

export const findMany = (model, { where, orderBy, take, skip }) =>
  model.findMany({ where, orderBy, take, skip });

export const count = (model, where) => model.count({ where });

export const findById = (model, idKey, id) =>
  model.findUnique({ where: { [idKey]: id } });

export const create = (model, data) => model.create({ data });

export const update = (model, idKey, id, data) =>
  model.update({ where: { [idKey]: id }, data });

export const remove = (model, idKey, id) =>
  model.delete({ where: { [idKey]: id } });

export const transaction = (ops) => prisma.$transaction(ops);
