import { redirect } from 'next/navigation';

import packageJson from '@/../package.json';
import { auth } from '@/auth';
import { EmailVerificationBanner } from '@/components/account/email-verification-banner';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';
import { UserRole } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === UserRole.ADMIN;
  const user = await findUserByIdCached(session.user.id);

  return (
    <>
      <DashboardNavbar mode="dashboard" isAdmin={isAdmin} />
      <EmailVerificationBanner emailVerified={user?.emailVerified ?? true} />
      {children}
      <div className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
    </>
  );
}
