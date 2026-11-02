'use client';

import { useEffect } from 'react';

import { useLogout } from '@/components/account/use-logout';

/**
 * Clears a session whose user no longer exists. Server Components cannot
 * remove the session cookie, so the sign-out has to run on the client.
 */
export function OrphanedSessionSignOut() {
  const { logout } = useLogout();

  useEffect(() => {
    void logout();
  }, [logout]);

  return null;
}
