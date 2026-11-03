import { Suspense } from 'react';

import packageJson from '@/../package.json';
import { AdminAccessGuard } from '@/components/navigation/admin-access-guard';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';
import { AdminPageSkeleton } from '@/components/skeletons/admin-page-skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar mode="admin" />
      <main>
        <Suspense fallback={<AdminPageSkeleton />}>
          <AdminAccessGuard>{children}</AdminAccessGuard>
        </Suspense>
      </main>
      <div className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
    </div>
  );
}
