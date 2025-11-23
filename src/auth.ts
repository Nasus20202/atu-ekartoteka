import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { notifyAdminsOfNewUser } from '@/lib/notifications/new-user-registration';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/turnstile';
import { AuthMethod } from '@/lib/types';

const logger = createLogger('auth');

interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
}

const authOptions: NextAuthConfig = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Hasło', type: 'password' },
        turnstileToken: { label: 'Turnstile Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Validate Turnstile only if enabled
        if (isTurnstileEnabled()) {
          if (!credentials.turnstileToken) {
            logger.warn(
              { email: credentials.email },
              'Login attempt failed: missing Turnstile token'
            );
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
            return null;
          }
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          logger.warn(
            { email: credentials.email },
            'Failed login attempt: user not found'
          );
          return null;
        }

        // For credentials provider, password should never be null
        if (!user.password) {
          logger.error(
            { email: credentials.email },
            'User has no password but trying to use credentials'
          );
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
          return null;
        }

        logger.info(
          {
            email: user.email,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
          },
          'User logged in successfully'
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
        token.status = extendedUser.status;
        token.emailVerified = extendedUser.emailVerified;
      }

      // Refresh user data from database only on update trigger
      if (trigger === 'update' && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            status: true,
            emailVerified: true,
          },
        });

        if (freshUser) {
          token.role = freshUser.role;
          token.status = freshUser.status;
          token.emailVerified = freshUser.emailVerified;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Use data from JWT token instead of fetching from database
        Object.assign(session.user, {
          id: token.id as string,
          role: token.role as string,
          status: token.status as string,
          emailVerified: token.emailVerified as boolean,
        });
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user from Google credentials
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                emailVerified: true, // Google accounts are verified
                password: null, // No password for OAuth users
                authMethod: AuthMethod.GOOGLE,
              },
            });

            // Notify admins about new Google user registration
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
              // Don't fail the login process if notification fails
            }

            // Populate user object with all required fields for JWT callback
            user.id = newUser.id;
            (user as ExtendedUser).role = newUser.role;
            (user as ExtendedUser).status = newUser.status;
            (user as ExtendedUser).emailVerified = newUser.emailVerified;
            return true;
          }

          // Populate user object with all required fields for JWT callback
          user.id = existingUser.id;
          (user as ExtendedUser).role = existingUser.role;
          (user as ExtendedUser).status = existingUser.status;
          (user as ExtendedUser).emailVerified = existingUser.emailVerified;
          return true;
        } catch (error) {
          logger.error(
            { error, email: user.email },
            'Error during Google sign in'
          );
          return false;
        }
      }

      return true; // Allow credentials provider
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
export { authOptions };
