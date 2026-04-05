import { DefaultSession } from 'next-auth';

import { UserRole } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
      mustChangePassword: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    status: string;
    mustChangePassword: boolean;
    emailVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    mustChangePassword: boolean;
  }
}
