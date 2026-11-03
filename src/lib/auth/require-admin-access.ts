import { redirect } from 'next/navigation';
import { cache } from 'react';

import { hasAdminAccess } from '@/lib/auth/admin-access';
import { getSession } from '@/lib/auth/get-session';

/** Session of an approved admin, checked in the database once per request. */
export const requireAdminAccess = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!(await hasAdminAccess(session.user.id))) {
    redirect('/dashboard');
  }

  return session;
});
