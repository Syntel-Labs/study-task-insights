import prisma from "#config/prismaClient.js";

export const findMany = ({ where, include, orderBy, take, skip }) =>
  prisma.taskTagAssignment.findMany({ where, include, orderBy, take, skip });

export const count = (where) => prisma.taskTagAssignment.count({ where });

export const findById = (id, include) =>
  prisma.taskTagAssignment.findUnique({
    where: { taskTagAssignmentId: String(id) },
    include,
  });

export const create = (data) => prisma.taskTagAssignment.create({ data });

export const remove = (id) =>
  prisma.taskTagAssignment.delete({
    where: { taskTagAssignmentId: String(id) },
  });

export const transaction = (ops) => prisma.$transaction(ops);
