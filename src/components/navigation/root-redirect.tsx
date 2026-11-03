import { redirect } from 'next/navigation';

import { isAdminRole } from '@/lib/auth/admin-access';
import { getSession } from '@/lib/auth/get-session';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';

export async function RootRedirect(): Promise<React.ReactNode> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserByIdCached(session.user.id);

  if (isAdminRole(user?.role)) {
    redirect('/admin/apartments');
  }

  redirect('/dashboard');
}
