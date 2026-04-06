import { prisma } from '@/lib/database/prisma';
import { AuthMethod } from '@/lib/types';

interface CreateGoogleUserInput {
  email: string;
  name: string | null | undefined;
}

export function createGoogleUser({ email, name }: CreateGoogleUserInput) {
  return prisma.user.create({
    data: {
      email,
      name: name ?? null,
      emailVerified: true,
      password: null,
      authMethod: AuthMethod.GOOGLE,
    },
  });
}
