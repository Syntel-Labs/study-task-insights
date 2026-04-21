import prisma from "#config/prismaClient.js";

export const transaction = (fn) => prisma.$transaction(fn);
