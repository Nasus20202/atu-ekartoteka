import { Suspense } from 'react';

import packageJson from '@/../package.json';
import { DashboardChrome } from '@/components/navigation/dashboard-chrome';
import { DashboardNavbarSkeleton } from '@/components/navigation/dashboard-navbar-skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<DashboardNavbarSkeleton />}>
        <DashboardChrome />
      </Suspense>
      {children}
      <div className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
    </>
  );
}
