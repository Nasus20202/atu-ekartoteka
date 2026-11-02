'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCallback, useState } from 'react';

const LOGIN_PATH = '/login';

export function useLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = useCallback(async () => {
    setPending(true);
    try {
      await signOut({ redirect: false });
      router.replace(LOGIN_PATH);
      router.refresh();
    } finally {
      setPending(false);
    }
  }, [router]);

  return { logout, pending } as const;
}
