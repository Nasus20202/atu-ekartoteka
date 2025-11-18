import { FileText } from 'lucide-react';
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
    area: number | null;
    height: number | null;
  };
  index: number;
}

export function ApartmentCard({ apartment, index }: ApartmentCardProps) {
  return (
    <div
      className="rounded-lg border bg-muted/50 p-4"
      style={{
        animationDelay: `${100 + index * 50}ms`,
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {apartment.address} {apartment.number}
          </h3>
          <p className="text-sm text-muted-foreground">
            {apartment.postalCode} {apartment.city}
          </p>
        </div>
        <Link href={`/dashboard/charges/${apartment.id}`}>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Naliczenia
          </Button>
        </Link>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {apartment.owner && (
          <div>
            <dt className="text-sm text-muted-foreground">Właściciel</dt>
            <dd className="font-medium">{apartment.owner}</dd>
          </div>
        )}
        {apartment.building && (
          <div>
            <dt className="text-sm text-muted-foreground">Budynek</dt>
            <dd className="font-medium">{apartment.building}</dd>
          </div>
        )}
        {apartment.area && (
          <div>
            <dt className="text-sm text-muted-foreground">Powierzchnia</dt>
            <dd className="font-medium">
              {apartment.area ? apartment.area / 100 : '-'} m²
            </dd>
          </div>
        )}
        {apartment.height && (
          <div>
            <dt className="text-sm text-muted-foreground">Wysokość</dt>
            <dd className="font-medium">
              {apartment.height ? apartment.height / 100 : '-'} cm
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
