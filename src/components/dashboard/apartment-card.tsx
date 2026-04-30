import { FileText, Wallet } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { type DecimalLike, toDecimal } from '@/lib/money/decimal';
import { formatCurrency } from '@/lib/utils';

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
    apartment.shareNumerator != null && apartment.shareDenominator != null
      ? ((apartment.shareNumerator / apartment.shareDenominator) * 100).toFixed(
          1
        ) + '%'
      : null;

  return (
    <div
      className="rounded-lg border bg-muted/50 p-4"
      style={{ animationDelay: `${100 + index * 50}ms` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">
            {apartment.address} {apartment.building || ''}/{apartment.number}
          </h3>
          <p className="text-sm text-muted-foreground">
            {apartment.postalCode} {apartment.city}
          </p>
        </div>

        {(hasPayments || hasCharges) && (
          <div className="flex gap-2 sm:shrink-0">
            {hasPayments && (
              <Link
                href={`/dashboard/payments/${apartment.id}/${apartment.payments?.[0]?.year || new Date().getFullYear()}`}
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
                href={`/dashboard/charges/${apartment.id}`}
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
                  : toDecimal(latestPaymentBalance).greaterThanOrEqualTo(0)
                    ? 'text-green-600'
                    : 'text-red-600'
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
