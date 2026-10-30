import { FileText, Wallet } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { MarqueeText } from '@/components/ui/marquee-text';
import { formatCurrency, formatSharePercent } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';
import { getBalanceStatusClass } from '@/lib/utils/balance-class';
import {
  getChargesHref,
  getPaymentYearHref,
} from '@/lib/utils/dashboard-links';
import type { DecimalLike } from '@/lib/utils/decimal';

interface ApartmentCardProps {
  apartment: {
    id: string;
    address: string | null;
    number: string;
    postalCode: string | null;
    city: string | null;
    owner: string | null;
    building: string | null;
    shareNumerator: number | null;
    shareDenominator: number | null;
    payments?: Array<{
      year: number;
    }>;
  };
  latestPaymentBalance?: DecimalLike | null;
  hasCharges?: boolean;
  hasPayments?: boolean;
  index: number;
}

export function ApartmentCard({
  apartment,
  latestPaymentBalance,
  hasCharges = false,
  hasPayments = false,
  index,
}: ApartmentCardProps) {
  const sharePercent =
    apartment.shareNumerator != null &&
    apartment.shareDenominator != null &&
    apartment.shareDenominator > 0
      ? `${formatSharePercent(apartment.shareNumerator, apartment.shareDenominator)}%`
      : null;

  const paymentYear = apartment.payments?.[0]?.year ?? new Date().getFullYear();

  return (
    <div
      className="rounded-lg border bg-muted/50 p-4"
      style={{ animationDelay: `${100 + index * 50}ms` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">
            <MarqueeText>{formatApartmentLabel(apartment)}</MarqueeText>
          </h3>
          <p className="text-sm text-muted-foreground">
            {apartment.postalCode} {apartment.city}
          </p>
        </div>

        {(hasPayments || hasCharges) && (
          <div className="flex gap-2 sm:shrink-0">
            {hasPayments && (
              <Link
                href={getPaymentYearHref(apartment.id, paymentYear)}
                className="flex-1 sm:flex-none"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Wpłaty
                </Button>
              </Link>
            )}
            {hasCharges && (
              <Link
                href={getChargesHref({ apartmentId: apartment.id })}
                className="flex-1 sm:flex-none"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Naliczenia
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {(apartment.owner || latestPaymentBalance != null || sharePercent) && (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Właściciel</dt>
            <dd className="font-medium">{apartment.owner ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Saldo wpłat</dt>
            <dd
              className={`text-xl font-bold ${
                latestPaymentBalance == null
                  ? 'text-muted-foreground'
                  : getBalanceStatusClass(latestPaymentBalance)
              }`}
            >
              {latestPaymentBalance != null
                ? formatCurrency(latestPaymentBalance)
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Udział</dt>
            <dd className="font-medium">{sharePercent ?? '—'}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
