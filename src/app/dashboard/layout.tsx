import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import { EmailVerificationBanner } from '@/components/email-verification-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <DashboardNavbar userId={session.user.id} />
      <EmailVerificationBanner />
      {children}
    </>
  );
}
