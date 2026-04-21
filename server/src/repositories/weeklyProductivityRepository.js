import prisma from "#config/prismaClient.js";

export const queryRaw = (sql, ...params) =>
  prisma.$queryRawUnsafe(sql, ...params);

export const executeRaw = (sql) => prisma.$executeRawUnsafe(sql);
