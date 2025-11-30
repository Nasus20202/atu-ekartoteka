import { FileText, Wallet } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

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
  latestPaymentBalance?: number | null;
  index: number;
}

export function ApartmentCard({
  apartment,
  latestPaymentBalance,
  index,
}: ApartmentCardProps) {
  return (
    <div
      className="rounded-lg border bg-muted/50 p-4"
      style={{
        animationDelay: `${100 + index * 50}ms`,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {apartment.address} {apartment.building || ''}/{apartment.number}
          </h3>
          <p className="text-sm text-muted-foreground">
            {apartment.postalCode} {apartment.city}
          </p>
        </div>
        <div className="flex flex-row gap-1">
          <Link
            href={`/dashboard/payments/${apartment.id}/${apartment.payments?.[0]?.year || new Date().getFullYear()}`}
          >
            <Button variant="outline" size="sm">
              <Wallet className="mr-2 h-4 w-4" />
              Wpłaty
            </Button>
          </Link>
          <Link href={`/dashboard/charges/${apartment.id}`}>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Naliczenia
            </Button>
          </Link>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {apartment.owner && (
          <div>
            <dt className="text-sm text-muted-foreground">Właściciel</dt>
            <dd className="font-medium">{apartment.owner}</dd>
          </div>
        )}
        {latestPaymentBalance !== undefined &&
          latestPaymentBalance !== null && (
            <div>
              <dt className="text-sm text-muted-foreground">Saldo wpłat</dt>
              <dd
                className={`text-xl font-bold ${
                  latestPaymentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {latestPaymentBalance.toFixed(2)} zł
              </dd>
            </div>
          )}
        {apartment.shareNumerator !== null &&
          apartment.shareNumerator !== undefined &&
          apartment.shareDenominator !== null &&
          apartment.shareDenominator !== undefined && (
            <div>
              <dt className="text-sm text-muted-foreground">Udział</dt>
              <dd className="font-medium">
                {(
                  (apartment.shareNumerator / apartment.shareDenominator) *
                  100
                ).toFixed(1)}
                %
              </dd>
            </div>
          )}
      </dl>
    </div>
  );
}
