import { PrismaClient } from '@prisma/client';

const prismaLogs = ['error', 'warn'];
const enablePrismaQueryLogs = process.env.PRISMA_LOG_QUERIES === 'true';

if (enablePrismaQueryLogs) {
  prismaLogs.push('query');
}

const prisma = new PrismaClient({
  log: prismaLogs,
});

export default prisma;
