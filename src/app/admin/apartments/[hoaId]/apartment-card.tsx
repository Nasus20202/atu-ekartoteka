import Link from 'next/link';

import {
  ApartmentStatusBadge,
  DuplicateAddressBadge,
} from '@/app/admin/apartments/[hoaId]/apartment-badges';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import { formatSharePercent } from '@/lib/utils';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

export function ApartmentCard({
  apartment,
  hoaId,
  isDuplicate,
}: {
  apartment: ApartmentSummaryDto;
  hoaId: string;
  isDuplicate: boolean;
}) {
  return (
    <Card
      className={`transition-all duration-300 hover:shadow-lg ${!apartment.isActive ? 'opacity-60 grayscale' : ''} ${isDuplicate ? 'border-amber-400 dark:border-amber-600' : ''}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {formatApartmentLabel(apartment)}
            </CardTitle>
            <CardDescription>
              {apartment.postalCode} {apartment.city}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ApartmentStatusBadge isActive={apartment.isActive} />
            {isDuplicate && <DuplicateAddressBadge />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Właściciel:</dt>
            <dd className="font-medium">{apartment.owner}</dd>
          </div>
          {apartment.shareRatio !== null && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Udział:</dt>
              <dd className="font-medium">
                {formatSharePercent(apartment.shareRatio)}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ID zewnętrzne:</dt>
            <dd className="font-mono text-xs">
              {apartment.externalApartmentId} / {apartment.externalOwnerId}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <Link href={`/admin/apartments/${hoaId}/${apartment.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              Zobacz szczegóły
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
