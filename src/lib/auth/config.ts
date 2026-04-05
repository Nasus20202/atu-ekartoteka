import { CredentialsSignin, type NextAuthConfig } from 'next-auth';

import { callbacks } from '@/lib/auth/callbacks';
import { buildProviders } from '@/lib/auth/providers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth');

export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  logger: {
    error: (error) => {
      if (error instanceof CredentialsSignin) {
        return;
      }
      logger.error({ error }, 'NextAuth error');
    },
    warn: (message) => {
      logger.warn({ message }, 'NextAuth warning');
    },
    debug: (message, metadata) => {
      logger.debug({ message, metadata }, 'NextAuth debug');
    },
  },
  providers: buildProviders(),
  callbacks,
};
