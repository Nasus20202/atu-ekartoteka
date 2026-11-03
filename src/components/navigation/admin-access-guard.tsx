import { redirect } from 'next/navigation';

import { hasAdminAccess } from '@/lib/auth/admin-access';
import { getSession } from '@/lib/auth/get-session';

interface AdminAccessGuardProps {
  children: React.ReactNode;
}

/** Renders the admin pages only for an approved admin, checked in the database. */
export async function AdminAccessGuard({ children }: AdminAccessGuardProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!(await hasAdminAccess(session.user.id))) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
