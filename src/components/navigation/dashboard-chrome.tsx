import { redirect } from 'next/navigation';

import { EmailVerificationBanner } from '@/components/account/email-verification-banner';
import { OrphanedSessionSignOut } from '@/components/account/orphaned-session-sign-out';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';
import { isApprovedAdmin } from '@/lib/auth/admin-access';
import { getSession } from '@/lib/auth/get-session';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';

export async function DashboardChrome() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserByIdCached(session.user.id);

  if (!user) {
    return <OrphanedSessionSignOut />;
  }

  return (
    <>
      <DashboardNavbar mode="dashboard" isAdmin={isApprovedAdmin(user)} />
      <EmailVerificationBanner emailVerified={user.emailVerified} />
    </>
  );
}
