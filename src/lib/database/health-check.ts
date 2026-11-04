import { prisma } from '@/lib/database/prisma';

/** Confirms the database answers a query; reads at most one row. */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.user.findFirst({ select: { id: true } });
    return true;
  } catch {
    return false;
  }
}
