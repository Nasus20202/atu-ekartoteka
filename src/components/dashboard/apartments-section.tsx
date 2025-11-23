import { AlertCircle, Building2 } from 'lucide-react';

import { ApartmentCard } from '@/components/dashboard/apartment-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Apartment, Payment } from '@/lib/types';

type ApartmentCardData = Pick<
  Apartment,
  | 'id'
  | 'address'
  | 'number'
  | 'postalCode'
  | 'city'
  | 'owner'
  | 'building'
  | 'area'
  | 'height'
> & {
  payments?: Pick<Payment, 'closingBalance'>[];
};

interface ApartmentsSectionProps {
  apartments: ApartmentCardData[];
}

export function ApartmentsSection({ apartments }: ApartmentsSectionProps) {
  const apartmentCount = apartments.length;
  const title =
    apartmentCount === 0
      ? 'Mieszkanie'
      : apartmentCount === 1
        ? 'Mieszkanie'
        : `Mieszkania (${apartmentCount})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {apartments.length > 0 ? (
          <div className="space-y-4">
            {apartments.map((apartment, index) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                latestPaymentBalance={
                  apartment.payments?.[0]?.closingBalance ?? null
                }
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Brak przypisanego mieszkania
                </p>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                  Administrator jeszcze nie przypisał Ci mieszkania. Skontaktuj
                  się z administratorem, jeśli uważasz, że to błąd.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
