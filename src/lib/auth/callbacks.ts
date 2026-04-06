import type { NextAuthConfig } from 'next-auth';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';
import { authMetrics } from '@/lib/opentelemetry/auth-metrics';
import { AuthMethod, UserRole } from '@/lib/types';

interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  emailVerified: boolean;
  mustChangePassword: boolean;
}

const logger = createLogger('auth:callbacks');

export const callbacks: NextAuthConfig['callbacks'] = {
  async jwt({ token, user, trigger }) {
    if (user) {
      const extendedUser = user as ExtendedUser;
      token.id = extendedUser.id;
      token.role = extendedUser.role;
      token.emailVerified = extendedUser.emailVerified;
      token.mustChangePassword = extendedUser.mustChangePassword;
    }

    if (trigger === 'update' && token.id) {
      const freshUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          role: true,
          emailVerified: true,
          mustChangePassword: true,
        },
      });

      if (freshUser) {
        token.role = freshUser.role;
        token.emailVerified = freshUser.emailVerified;
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
        emailVerified: token.emailVerified as boolean,
        mustChangePassword: token.mustChangePassword as boolean,
      });
    }
    return session;
  },

  async signIn({ user, account }) {
    if (account?.provider === 'google') {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              emailVerified: true,
              password: null,
              authMethod: AuthMethod.GOOGLE,
            },
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
