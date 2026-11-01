import { redirect } from 'next/navigation';

import packageJson from '@/../package.json';
import { auth } from '@/auth';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';
import { hasAdminAccess } from '@/lib/auth/admin-access';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (!(await hasAdminAccess(session.user.id))) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar mode="admin" />
      <main>{children}</main>
      <div className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
    </div>
  );
}
