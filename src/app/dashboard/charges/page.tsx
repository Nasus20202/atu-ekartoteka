import { FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { MultiChargesDisplay } from '@/components/charges/multi-charges-display';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { findUserWithApartmentChargesCached } from '@/lib/queries/users/find-user-with-apartment-charges';
import { AccountStatus } from '@/lib/types';
import {
  type ChargeDisplayDto,
  toChargeDisplayDto,
} from '@/lib/types/dto/charge-dto';

type ApartmentPeriodData = {
  apartmentNumber: string;
  apartmentAddress: string;
  hoaName: string;
  charges: ChargeDisplayDto[];
};

export default async function ChargesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userData = await findUserWithApartmentChargesCached(session.user.id);

  if (!userData || userData.status !== AccountStatus.APPROVED) {
    redirect('/dashboard');
  }

  const chargesByPeriod: Record<string, ApartmentPeriodData[]> = {};

  userData.apartments.forEach(
    (apartment: (typeof userData.apartments)[number]) => {
      const apartmentLabel =
        `${apartment.address || ''} ${apartment.building || ''}/${apartment.number}`
          .replace(/\s+\//g, ' /')
          .trim();

      apartment.charges.forEach(
        (charge: (typeof apartment.charges)[number]) => {
          if (!chargesByPeriod[charge.period]) {
            chargesByPeriod[charge.period] = [];
          }

          const periodData = chargesByPeriod[charge.period];
          let apartmentData = periodData.find(
            (a) => a.apartmentNumber === apartment.number
          );

          if (!apartmentData) {
            apartmentData = {
              apartmentNumber: apartment.number,
              apartmentAddress: apartmentLabel,
              hoaName: apartment.homeownersAssociation.name,
              charges: [],
            };
            periodData.push(apartmentData);
          }

          apartmentData.charges.push(toChargeDisplayDto(charge));
        }
      );
    }
  );

  const periods = Object.keys(chargesByPeriod).sort().reverse();

  return (
    <Page>
      <PageHeader title="Naliczenia" />

      {periods.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-50 items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Brak naliczeń</p>
              <p className="text-sm text-muted-foreground">
                Nie znaleziono żadnych naliczeń dla Twoich mieszkań.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <MultiChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
        />
      )}
    </Page>
  );
}
