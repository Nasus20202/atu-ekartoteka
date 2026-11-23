import { loadApartmentCharges } from '@/app/dashboard/charges/[apartmentId]/load-apartment-charges';
import { PageHeader } from '@/components/layout/page-header';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';

interface ApartmentChargesHeaderProps {
  params: Promise<{ apartmentId: string }>;
}

export async function ApartmentChargesHeader({
  params,
}: ApartmentChargesHeaderProps) {
  const { apartmentId } = await params;
  const apartment = await loadApartmentCharges(apartmentId);

  return (
    <PageHeader
      className={REVEAL_CLASS}
      title={formatApartmentLabel(apartment)}
      description={`${apartment.postalCode} ${apartment.city}`}
    />
  );
}
