import { notFound } from 'next/navigation';

import { ApartmentDetailsContent } from '@/components/apartments/apartment-details-content';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { AdminSettlementsCard } from '@/components/settlements/admin-settlements-card';
import {
  readSelection,
  type SettlementSearchParams,
} from '@/components/settlements/settlement-search-params';
import { loadApartmentDetail } from '@/lib/apartments/queries/load-apartment-detail';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { getRequestNow } from '@/lib/framework/request-now';
import { findAdminSettlements } from '@/lib/settlements/queries/find-admin-settlements';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';

interface ApartmentDetailsSectionProps {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<SettlementSearchParams>;
}

export async function ApartmentDetailsSection({
  params,
  searchParams,
}: ApartmentDetailsSectionProps) {
  await requireAdminAccess();
  const { apartmentId } = await params;
  const [apartment, settlements] = await Promise.all([
    loadApartmentDetail(apartmentId, await getRequestNow()),
    findAdminSettlements(apartmentId, readSelection(await searchParams)),
  ]);

  // Settlements are null when the address names a record of another apartment
  if (!apartment || !settlements) {
    notFound();
  }

  const hasSettlements =
    settlements.utilityPeriods.length > 0 ||
    settlements.annualPeriods.length > 0;

  return (
    <div className={REVEAL_CLASS}>
      <ApartmentDetailsContent
        apartmentId={apartmentId}
        initialApartment={apartment}
        settlements={
          hasSettlements && (
            <AdminSettlementsCard
              data={settlements}
              apartmentLabel={formatApartmentLabel(apartment)}
              hoaName={apartment.homeownersAssociation.name}
            />
          )
        }
      />
    </div>
  );
}
