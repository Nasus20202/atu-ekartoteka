import { getPeriodTotal } from '@/app/dashboard/dashboard-data';
import {
  loadAccountUser,
  loadApartmentsWithCharges,
  loadDashboardContext,
  loadPeriodTotals,
} from '@/app/dashboard/dashboard-loaders';
import { getChargeTrendByApartment } from '@/components/charts/chart-data';
import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { isApprovedAccount } from '@/lib/auth/account-access';

export async function ChargesSection() {
  const [account, apartments, periodTotals, { currentPeriod, previousPeriod }] =
    await Promise.all([
      loadAccountUser(),
      loadApartmentsWithCharges(),
      loadPeriodTotals(),
      loadDashboardContext(),
    ]);

  if (!account || !isApprovedAccount(account) || apartments.length === 0) {
    return null;
  }

  const currentMonth = getPeriodTotal(periodTotals, currentPeriod);
  const previousMonth = getPeriodTotal(periodTotals, previousPeriod);
  const trend = getChargeTrendByApartment(apartments, currentPeriod);

  return (
    <div className={REVEAL_CLASS}>
      <ChargesSummaryCard
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        currentMonthCount={currentMonth.count}
        previousMonthCount={previousMonth.count}
        currentMonthTotal={currentMonth.total}
        previousMonthTotal={previousMonth.total}
        trendData={trend.data}
        trendSeries={trend.series}
      />
    </div>
  );
}
