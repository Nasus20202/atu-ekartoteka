import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { prisma } from '@/lib/prisma';

interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  apartmentId?: string | null;
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
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
        // Fetch fresh user data from database to get current status and apartment
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            apartmentId: true,
            apartment: {
              select: {
                id: true,
                externalId: true,
                owner: true,
                address: true,
                building: true,
                number: true,
                postalCode: true,
                city: true,
                area: true,
                height: true,
                isActive: true,
              },
            },
          },
        });

        if (user) {
          const extendedSession = session.user as ExtendedUser & {
            apartment?: typeof user.apartment;
          };
          extendedSession.id = user.id;
          extendedSession.role = user.role;
          extendedSession.status = user.status;
          extendedSession.apartmentId = user.apartmentId;
          extendedSession.apartment = user.apartment;
        }
      }
      return session;
    },
  },
});
