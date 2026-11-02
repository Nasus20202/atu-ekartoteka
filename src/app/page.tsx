import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { isAdminRole } from '@/lib/auth/admin-access';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserByIdCached(session.user.id);

  if (isAdminRole(user?.role)) {
    redirect('/admin/apartments');
  }

  redirect('/dashboard');
}
