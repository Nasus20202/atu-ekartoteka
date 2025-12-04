import { FileText } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPeriod } from '@/lib/utils';

interface ChargesSummaryCardProps {
  currentPeriod: string;
  previousPeriod: string;
  currentMonthCharges: Array<{ totalAmount: number }>;
  previousMonthCharges: Array<{ totalAmount: number }>;
  currentMonthTotal: number;
  previousMonthTotal: number;
}

export function ChargesSummaryCard({
  currentPeriod,
  previousPeriod,
  currentMonthCharges,
  previousMonthCharges,
  currentMonthTotal,
  previousMonthTotal,
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
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {formatPeriod(currentPeriod)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentMonthCharges.length}{' '}
                        {currentMonthCharges.length === 1
                          ? 'naliczenie'
                          : currentMonthCharges.length < 5
                            ? 'naliczenia'
                            : 'naliczeń'}
                      </p>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCurrency(currentMonthTotal)}
                    </p>
                  </div>
                </div>
              )}
              {previousMonthCharges.length > 0 && (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {formatPeriod(previousPeriod)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {previousMonthCharges.length}{' '}
                        {previousMonthCharges.length === 1
                          ? 'naliczenie'
                          : previousMonthCharges.length < 5
                            ? 'naliczenia'
                            : 'naliczeń'}
                      </p>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCurrency(previousMonthTotal)}
                    </p>
                  </div>
                </div>
              )}
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
