import type { NextAuthConfig } from 'next-auth';

import { createLogger } from '@/lib/logger';
import { createGoogleUser } from '@/lib/mutations/users/create-google-user';
import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { findUserByEmail } from '@/lib/queries/users/find-user-by-email';
import { findUserTokenFields } from '@/lib/queries/users/find-user-token-fields';
import { UserRole } from '@/lib/types';

interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  mustChangePassword: boolean;
}

const logger = createLogger('auth:callbacks');

export const callbacks: NextAuthConfig['callbacks'] = {
  async jwt({ token, user, trigger }) {
    if (user) {
      const extendedUser = user as ExtendedUser;
      token.id = extendedUser.id;
      token.role = extendedUser.role;
      token.mustChangePassword = extendedUser.mustChangePassword;
    }

    if (trigger === 'update' && token.id) {
      const freshUser = await findUserTokenFields(token.id as string);

      if (freshUser) {
        token.role = freshUser.role;
        token.mustChangePassword = freshUser.mustChangePassword;
      }
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user && token.id) {
      Object.assign(session.user, {
        id: token.id as string,
        role: token.role as string,
        mustChangePassword: token.mustChangePassword as boolean,
      });
    }
    return session;
  },

  async signIn({ user, account }) {
    if (account?.provider === 'google') {
      try {
        const existingUser = await findUserByEmail(user.email!);

        if (!existingUser) {
          const newUser = await createGoogleUser({
            email: user.email!,
            name: user.name,
          });

          try {
            await notifyAdminsOfNewUser(
              newUser.email,
              newUser.name || 'Nie podano imienia',
              newUser.createdAt
            );
          } catch (notificationError) {
            logger.error(
              { notificationError, email: newUser.email },
              'Failed to notify admins about new Google user'
            );
          }

          user.id = newUser.id;
          (user as ExtendedUser).role = newUser.role;
          (user as ExtendedUser).mustChangePassword =
            newUser.mustChangePassword;

          authMetrics.recordRegistration('google', 'success');
          authMetrics.recordLogin('google', 'success');
          return true;
        }

        user.id = existingUser.id;
        (user as ExtendedUser).role = existingUser.role;
        (user as ExtendedUser).mustChangePassword =
          existingUser.mustChangePassword;

        authMetrics.recordLogin('google', 'success');
        return true;
      } catch (error) {
        logger.error(
          { error, email: user.email },
          'Error during Google sign in'
        );
        authMetrics.recordLogin('google', 'failure', 'google_error');
        return false;
      }
    }

    return true;
  },
};
