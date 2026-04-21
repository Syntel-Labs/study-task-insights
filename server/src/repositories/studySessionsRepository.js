import prisma from "#config/prismaClient.js";

export const findMany = ({ where, include, orderBy, take, skip }) =>
  prisma.studySession.findMany({ where, include, orderBy, take, skip });

export const count = (where) => prisma.studySession.count({ where });

export const findById = (id, include) =>
  prisma.studySession.findUnique({
    where: { studySessionId: String(id) },
    include,
  });

export const findByIdSelect = (id, select) =>
  prisma.studySession.findUnique({
    where: { studySessionId: String(id) },
    select,
  });

export const create = (data) => prisma.studySession.create({ data });

export const update = (id, data) =>
  prisma.studySession.update({ where: { studySessionId: String(id) }, data });

export const remove = (id) =>
  prisma.studySession.delete({ where: { studySessionId: String(id) } });

export const transaction = (fn) => prisma.$transaction(fn);
