import { FileText } from 'lucide-react';
import Link from 'next/link';

import { ChargeTrendChart } from '@/components/charts/charge-trend-chart';
import type {
  ChargeTrendDatum,
  ChargeTrendSeries,
} from '@/components/charts/chart-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPeriod } from '@/lib/utils';
import { getChargesHref } from '@/lib/utils/dashboard-links';
import type { DecimalLike } from '@/lib/utils/decimal';

interface ChargesSummaryCardProps {
  currentPeriod: string;
  previousPeriod: string;
  currentMonthCharges: Array<{ totalAmount: DecimalLike }>;
  previousMonthCharges: Array<{ totalAmount: DecimalLike }>;
  currentMonthTotal: DecimalLike;
  previousMonthTotal: DecimalLike;
  trendData?: ChargeTrendDatum[];
  trendSeries?: ChargeTrendSeries[];
}

function formatChargeCount(count: number): string {
  if (count === 1) return 'naliczenie';
  return count < 5 ? 'naliczenia' : 'naliczeń';
}

interface ChargePeriodTileProps {
  period: string;
  count: number;
  total: DecimalLike;
}

function ChargePeriodTile({ period, count, total }: ChargePeriodTileProps) {
  return (
    <Link
      href={getChargesHref({ period })}
      className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{formatPeriod(period)}</p>
          <p className="text-sm text-muted-foreground">
            {count} {formatChargeCount(count)}
          </p>
        </div>
        <p className="shrink-0 text-xl font-bold">{formatCurrency(total)}</p>
      </div>
    </Link>
  );
}

export function ChargesSummaryCard({
  currentPeriod,
  previousPeriod,
  currentMonthCharges,
  previousMonthCharges,
  currentMonthTotal,
  previousMonthTotal,
  trendData = [],
  trendSeries = [],
}: ChargesSummaryCardProps) {
  const hasCharges =
    currentMonthCharges.length > 0 || previousMonthCharges.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Naliczenia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCharges ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentMonthCharges.length > 0 && (
                <ChargePeriodTile
                  period={currentPeriod}
                  count={currentMonthCharges.length}
                  total={currentMonthTotal}
                />
              )}
              {previousMonthCharges.length > 0 && (
                <ChargePeriodTile
                  period={previousPeriod}
                  count={previousMonthCharges.length}
                  total={previousMonthTotal}
                />
              )}
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">
                Naliczenia z ostatnich 12 miesięcy
              </p>
              <ChargeTrendChart data={trendData} series={trendSeries} />
            </div>
            <Link href="/dashboard/charges">
              <Button className="w-full" variant="secondary">
                Zobacz wszystkie naliczenia
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Brak naliczeń dla ostatnich miesięcy.
            </p>
            <div className="rounded-lg border p-3">
              <ChargeTrendChart data={trendData} series={trendSeries} />
            </div>
            <Link href="/dashboard/charges">
              <Button className="w-full" variant="secondary">
                Zobacz naliczenia
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
