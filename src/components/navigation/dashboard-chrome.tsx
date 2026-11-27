import { redirect } from 'next/navigation';

import { EmailVerificationBanner } from '@/components/account/email-verification-banner';
import { OrphanedSessionSignOut } from '@/components/account/orphaned-session-sign-out';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';
import { isApprovedAccount } from '@/lib/auth/rules/account-access';
import { isApprovedAdmin } from '@/lib/auth/rules/admin-access';
import { getSession } from '@/lib/framework/auth/get-session';
import { getRequestNow } from '@/lib/framework/request-now';
import { findUserByIdCached } from '@/lib/framework/rsc-cache';
import { countAwaitingVotings } from '@/lib/voting/queries/count-awaiting-votings';

export async function DashboardChrome() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserByIdCached(session.user.id);

  if (!user) {
    return <OrphanedSessionSignOut />;
  }

  const pendingVotings = isApprovedAccount(user)
    ? await countAwaitingVotings(user.id, await getRequestNow())
    : undefined;

  return (
    <>
      <DashboardNavbar
        mode="dashboard"
        isAdmin={isApprovedAdmin(user)}
        pendingVotings={pendingVotings}
      />
      <EmailVerificationBanner emailVerified={user.emailVerified} />
    </>
  );
}
