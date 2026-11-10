import { Suspense } from 'react';

import { AppFooter } from '@/components/layout/app-footer';
import { DashboardChrome } from '@/components/navigation/dashboard-chrome';
import { DashboardNavbarSkeleton } from '@/components/navigation/dashboard-navbar-skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<DashboardNavbarSkeleton />}>
        <DashboardChrome />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
      <AppFooter />
    </div>
  );
}
