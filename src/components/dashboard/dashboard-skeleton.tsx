import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ApartmentsCardSkeleton } from '@/components/dashboard/skeletons/apartments-card-skeleton';
import { ChargesCardSkeleton } from '@/components/dashboard/skeletons/charges-card-skeleton';
import { GreetingSkeleton } from '@/components/dashboard/skeletons/greeting-skeleton';
import { NotificationsCardSkeleton } from '@/components/dashboard/skeletons/notifications-card-skeleton';
import { PaymentsCardSkeleton } from '@/components/dashboard/skeletons/payments-card-skeleton';
import { StatusCardSkeleton } from '@/components/dashboard/skeletons/status-card-skeleton';

/** The dashboard page's own skeletons in its layout, shown on client navigation. */
export function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton">
      <DashboardShell
        greeting={<GreetingSkeleton />}
        notifications={<NotificationsCardSkeleton />}
        main={
          <>
            <StatusCardSkeleton />
            <PaymentsCardSkeleton />
            <ChargesCardSkeleton />
            <ApartmentsCardSkeleton />
          </>
        }
      />
    </div>
  );
}
