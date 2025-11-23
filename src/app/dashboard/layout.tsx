import { redirect } from 'next/navigation';

import packageJson from '@/../package.json';
import { auth } from '@/auth';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import { EmailVerificationBanner } from '@/components/email-verification-banner';
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

  return (
    <>
      <DashboardNavbar mode="dashboard" isAdmin={isAdmin} />
      <EmailVerificationBanner />
      {children}
      <div className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
    </>
  );
}
