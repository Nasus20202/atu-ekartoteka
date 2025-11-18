import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
      apartmentId?: string | null;
      apartment?: {
        id: string;
        externalId: string;
        owner?: string | null;
        address?: string | null;
        building?: string | null;
        number: string;
        postalCode?: string | null;
        city?: string | null;
        area?: number | null;
        height?: number | null;
        isActive: boolean;
      } | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    status: string;
    apartmentId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
