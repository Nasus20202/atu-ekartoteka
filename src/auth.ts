import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { verifyTurnstileToken } from '@/lib/turnstile';

const logger = createLogger('auth');

interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        turnstileToken: { label: 'Turnstile Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Validate turnstile token
        const turnstileToken =
          typeof credentials.turnstileToken === 'string'
            ? credentials.turnstileToken
            : undefined;
        const valid = await verifyTurnstileToken(turnstileToken);
        if (!valid) {
          logger.warn(
            { email: credentials.email },
            'Login failed: invalid Turnstile token'
          );
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          logger.warn(
            { email: credentials.email },
            'Failed login attempt: user not found'
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
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Fetch fresh user data from database to get current status
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            emailVerified: true,
          },
        });

        if (user) {
          // Extend session with user data
          Object.assign(session.user, {
            id: user.id,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
          });
        }
      }
      return session;
    },
  },
});
