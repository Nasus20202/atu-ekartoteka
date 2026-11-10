import bcrypt from 'bcrypt';
import type { User } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { BCRYPT_COST } from '@/lib/auth/bcrypt-cost';
import { normalizeEmail } from '@/lib/auth/email';
import { verifyRegistrationAutoLoginToken } from '@/lib/auth/registration-auto-login-token';
import { createLogger } from '@/lib/logger';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/turnstile';

const logger = createLogger('auth:providers');

const TIMING_DUMMY_PASSWORD = 'timing-equalisation-placeholder';
let dummyHashPromise: Promise<string> | undefined;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash(TIMING_DUMMY_PASSWORD, BCRYPT_COST);
  return dummyHashPromise;
}

/**
 * Spends the same bcrypt work as a real comparison so the response time does
 * not reveal whether the account exists.
 */
async function burnPasswordComparison(password: string): Promise<void> {
  try {
    await bcrypt.compare(password, await getDummyHash());
  } catch (error) {
    logger.warn({ error }, 'Dummy password comparison failed');
  }
}
function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  ...(process.env.GOOGLE_ISSUER_URL && {
    issuer: process.env.GOOGLE_ISSUER_URL,
  }),
});

export async function credentialsAuthorize(
  credentials: Partial<Record<string, unknown>> | undefined
): Promise<User | null> {
  const email = normalizeEmail(String(credentials?.email ?? ''));
  const password = credentials?.password as string | undefined;

  if (!email || !password) {
    return null;
  }

  const hasAutoLoginGrant = verifyRegistrationAutoLoginToken(
    credentials?.autoLoginBypassToken as string | undefined,
    email
  );

  if (isTurnstileEnabled()) {
    if (hasAutoLoginGrant) {
      logger.info(
        'Login Turnstile bypass accepted for post-registration auto-login'
      );
    } else if (!credentials?.turnstileToken) {
      logger.warn('Login attempt failed: missing Turnstile token');
      authMetrics.recordLogin('credentials', 'failure', 'missing_turnstile');
      return null;
    } else {
      const valid = await verifyTurnstileToken(
        credentials.turnstileToken as string
      );
      if (!valid) {
        logger.warn('Login attempt failed: invalid Turnstile token');
        authMetrics.recordLogin('credentials', 'failure', 'invalid_turnstile');
        return null;
      }
    }
  }

  const user = await findUserByEmail(email);

  if (!user) {
    await burnPasswordComparison(password);
    logger.warn('Failed login attempt: user not found');
    authMetrics.recordLogin('credentials', 'failure', 'user_not_found');
    return null;
  }

  if (!user.password) {
    await burnPasswordComparison(password);
    logger.error(
      { userId: user.id },
      'User has no password but trying to use credentials'
    );
    authMetrics.recordLogin('credentials', 'failure', 'no_password');
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    logger.warn(
      { userId: user.id },
      'Failed login attempt: incorrect password'
    );
    authMetrics.recordLogin('credentials', 'failure', 'invalid_credentials');
    return null;
  }

  logger.info(
    {
      userId: user.id,
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
    autoLoginBypassToken: { label: 'Auto Login Bypass Token', type: 'text' },
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
