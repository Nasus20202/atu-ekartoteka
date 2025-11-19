import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { DashboardNavbar } from '@/components/dashboard-navbar';

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
      {children}
    </>
  );
}
