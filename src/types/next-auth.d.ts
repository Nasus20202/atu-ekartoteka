import { DefaultSession } from 'next-auth';

import { UserRole } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      emailVerified: boolean;
      mustChangePassword: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    emailVerified: boolean;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    emailVerified: boolean;
    mustChangePassword: boolean;
  }
}
