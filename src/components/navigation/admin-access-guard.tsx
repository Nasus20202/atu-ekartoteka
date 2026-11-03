import { requireAdminAccess } from '@/lib/auth/require-admin-access';

interface AdminAccessGuardProps {
  children: React.ReactNode;
}

/** Renders the admin pages only for an approved admin, checked in the database. */
export async function AdminAccessGuard({ children }: AdminAccessGuardProps) {
  await requireAdminAccess();

  return <>{children}</>;
}
