import { DefaultSession } from 'next-auth';

import { UserRole } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    status: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
