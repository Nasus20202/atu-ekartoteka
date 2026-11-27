import { prisma } from '@/lib/platform/database/prisma';

export async function hoaExists(id: string): Promise<boolean> {
  return (await prisma.homeownersAssociation.count({ where: { id } })) > 0;
}
