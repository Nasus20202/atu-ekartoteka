import { buildApartmentBalances } from '@/app/dashboard/dashboard-data';
import {
  loadAccountUser,
  loadDashboardContext,
  loadDashboardUser,
} from '@/app/dashboard/dashboard-loaders';
import { PaymentsSummaryCard } from '@/components/dashboard/payments-summary-card';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { isApprovedAccount } from '@/lib/auth/account-access';

export async function PaymentsSection() {
  const [account, user, { currentPeriod }] = await Promise.all([
    loadAccountUser(),
    loadDashboardUser(),
    loadDashboardContext(),
  ]);

  if (!account || !user || !isApprovedAccount(account)) {
    return null;
  }

  const apartmentBalances = buildApartmentBalances(
    user.apartments,
    currentPeriod
  );

  if (apartmentBalances.length === 0) {
    return null;
  }

  return (
    <div className={REVEAL_CLASS}>
      <PaymentsSummaryCard apartmentBalances={apartmentBalances} />
    </div>
  );
}
