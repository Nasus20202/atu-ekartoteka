import { Building2 } from 'lucide-react';

import { loadApartmentCharges } from '@/app/dashboard/charges/[apartmentId]/load-apartment-charges';
import {
  getSortedPeriods,
  groupChargesByPeriod,
  toActivePeriod,
} from '@/app/dashboard/charges/charges-by-period';
import { ChargesDisplay } from '@/components/charges/charges-display';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { Card, CardContent } from '@/components/ui/card';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

interface ApartmentChargesContentProps {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<{ month?: string }>;
}

export async function ApartmentChargesContent({
  params,
  searchParams,
}: ApartmentChargesContentProps) {
  const [{ apartmentId }, { month }] = await Promise.all([
    params,
    searchParams,
  ]);
  const apartment = await loadApartmentCharges(apartmentId);
  const chargesByPeriod = groupChargesByPeriod(apartment.charges);
  const periods = getSortedPeriods(chargesByPeriod);

  return (
    <div className={REVEAL_CLASS}>
      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-50 items-center justify-center">
            <div className="text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Brak naliczeń</p>
              <p className="text-sm text-muted-foreground">
                Nie znaleziono żadnych naliczeń dla tego mieszkania.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
          activeMonth={toActivePeriod(month)}
          apartmentLabel={formatApartmentLabel(apartment)}
          hoaName={apartment.homeownersAssociation.name}
        />
      )}
    </div>
  );
}
