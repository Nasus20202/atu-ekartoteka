import bcrypt from 'bcryptjs';
import type { User } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/turnstile';
import { UserRole } from '@/lib/types';

const logger = createLogger('auth:providers');

function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

export async function credentialsAuthorize(
  credentials: Partial<Record<string, unknown>> | undefined
): Promise<User | null> {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  if (isTurnstileEnabled()) {
    if (!credentials.turnstileToken) {
      logger.warn(
        { email: credentials.email },
        'Login attempt failed: missing Turnstile token'
      );
      authMetrics.recordLogin('credentials', 'failure', 'missing_turnstile');
      return null;
    }

    const valid = await verifyTurnstileToken(
      credentials.turnstileToken as string
    );
    if (!valid) {
      logger.warn(
        { email: credentials.email },
        'Login attempt failed: invalid Turnstile token'
      );
      authMetrics.recordLogin('credentials', 'failure', 'invalid_turnstile');
      return null;
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string },
  });

  if (!user) {
    logger.warn(
      { email: credentials.email },
      'Failed login attempt: user not found'
    );
    authMetrics.recordLogin('credentials', 'failure', 'user_not_found');
    return null;
  }

  if (!user.password) {
    logger.error(
      { email: credentials.email },
      'User has no password but trying to use credentials'
    );
    authMetrics.recordLogin('credentials', 'failure', 'no_password');
    return null;
  }

  const passwordMatch = await bcrypt.compare(
    credentials.password as string,
    user.password
  );

  if (!passwordMatch) {
    logger.warn(
      { email: credentials.email },
      'Failed login attempt: incorrect password'
    );
    authMetrics.recordLogin('credentials', 'failure', 'invalid_credentials');
    return null;
  }

  logger.info(
    {
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
    },
    'User logged in successfully'
  );

  authMetrics.recordLogin('credentials', 'success');

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    mustChangePassword: user.mustChangePassword,
  };
}

const credentialsProvider = Credentials({
  id: 'credentials',
  name: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Hasło', type: 'password' },
    turnstileToken: { label: 'Turnstile Token', type: 'text' },
  },
  authorize: credentialsAuthorize,
});

export function buildProviders(): Provider[] {
  const providers: Provider[] = [credentialsProvider];
  if (isGoogleConfigured()) {
    providers.unshift(googleProvider);
  }
  return providers;
}
