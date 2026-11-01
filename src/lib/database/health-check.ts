import { prisma } from '@/lib/database/prisma';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.user.count();
    return true;
  } catch {
    return false;
  }
}
