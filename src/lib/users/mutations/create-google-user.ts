import { normalizeEmail } from '@/lib/auth/rules/email';
import { AuthMethod } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

interface CreateGoogleUserInput {
  email: string;
  name: string | null | undefined;
}

export function createGoogleUser({ email, name }: CreateGoogleUserInput) {
  return prisma.user.create({
    data: {
      email: normalizeEmail(email),
      name: name ?? null,
      emailVerified: true,
      password: null,
      authMethod: AuthMethod.GOOGLE,
    },
  });
}
