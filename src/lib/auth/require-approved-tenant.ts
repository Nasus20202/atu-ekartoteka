import { redirect } from 'next/navigation';
import { cache } from 'react';

import { isApprovedAccount } from '@/lib/auth/account-access';
import { getSession } from '@/lib/auth/get-session';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';

/** Session owner who is an approved account; anyone else is sent away. */
export const requireApprovedTenant = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserByIdCached(session.user.id);

  if (!user || !isApprovedAccount(user)) {
    redirect('/dashboard');
  }

  return { userId: session.user.id, user };
});
