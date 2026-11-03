import { FileText } from 'lucide-react';
import Link from 'next/link';

import type {
  ChargeTrendDatum,
  ChargeTrendSeries,
} from '@/components/charts/chart-data';
import { LazyChargeTrendChart } from '@/components/charts/lazy-charge-trend-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency, formatPeriod } from '@/lib/utils';
import { getChargesHref } from '@/lib/utils/dashboard-links';
import type { DecimalLike } from '@/lib/utils/decimal';
import { CHARGE_FORMS, formatCountPl } from '@/lib/utils/pluralize';

interface ChargesSummaryCardProps {
  currentPeriod: string;
  previousPeriod: string;
  currentMonthCount: number;
  previousMonthCount: number;
  currentMonthTotal: DecimalLike;
  previousMonthTotal: DecimalLike;
  trendData?: ChargeTrendDatum[];
  trendSeries?: ChargeTrendSeries[];
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
            {formatCountPl(count, CHARGE_FORMS)}
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
  currentMonthCount,
  previousMonthCount,
  currentMonthTotal,
  previousMonthTotal,
  trendData = [],
  trendSeries = [],
}: ChargesSummaryCardProps) {
  const hasCharges = currentMonthCount > 0 || previousMonthCount > 0;
  const hasBothPeriods = currentMonthCount > 0 && previousMonthCount > 0;

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
            <div
              className={cn('grid gap-3', hasBothPeriods && 'sm:grid-cols-2')}
            >
              {currentMonthCount > 0 && (
                <ChargePeriodTile
                  period={currentPeriod}
                  count={currentMonthCount}
                  total={currentMonthTotal}
                />
              )}
              {previousMonthCount > 0 && (
                <ChargePeriodTile
                  period={previousPeriod}
                  count={previousMonthCount}
                  total={previousMonthTotal}
                />
              )}
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">
                Naliczenia z ostatnich 12 miesięcy
              </p>
              <LazyChargeTrendChart data={trendData} series={trendSeries} />
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
              <LazyChargeTrendChart data={trendData} series={trendSeries} />
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
