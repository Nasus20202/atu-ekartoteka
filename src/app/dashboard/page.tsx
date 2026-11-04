import { Suspense } from 'react';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { AccountStatusSection } from '@/components/dashboard/sections/account-status-section';
import { ApartmentsListSection } from '@/components/dashboard/sections/apartments-list-section';
import { ChargesSection } from '@/components/dashboard/sections/charges-section';
import { DashboardGreeting } from '@/components/dashboard/sections/dashboard-greeting';
import { NotificationsSection } from '@/components/dashboard/sections/notifications-section';
import { PaymentsSection } from '@/components/dashboard/sections/payments-section';
import { ApartmentsCardSkeleton } from '@/components/dashboard/skeletons/apartments-card-skeleton';
import { ChargesCardSkeleton } from '@/components/dashboard/skeletons/charges-card-skeleton';
import { GreetingSkeleton } from '@/components/dashboard/skeletons/greeting-skeleton';
import { NotificationsCardSkeleton } from '@/components/dashboard/skeletons/notifications-card-skeleton';
import { PaymentsCardSkeleton } from '@/components/dashboard/skeletons/payments-card-skeleton';
import { StatusCardSkeleton } from '@/components/dashboard/skeletons/status-card-skeleton';

// The page itself reads no request data: the shell is prerendered and every
// section streams in behind its own boundary, so independent data loads in parallel.
export default function DashboardPage() {
  return (
    <DashboardShell
      greeting={
        <Suspense fallback={<GreetingSkeleton />}>
          <DashboardGreeting />
        </Suspense>
      }
      notifications={
        <Suspense fallback={<NotificationsCardSkeleton />}>
          <NotificationsSection />
        </Suspense>
      }
      main={
        <>
          <Suspense fallback={<StatusCardSkeleton />}>
            <AccountStatusSection />
          </Suspense>
          <Suspense fallback={<PaymentsCardSkeleton />}>
            <PaymentsSection />
          </Suspense>
          <Suspense fallback={<ChargesCardSkeleton />}>
            <ChargesSection />
          </Suspense>
          <Suspense fallback={<ApartmentsCardSkeleton />}>
            <ApartmentsListSection />
          </Suspense>
        </>
      }
    />
  );
}
