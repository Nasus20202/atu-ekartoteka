import { loadApartmentDetail } from '@/app/api/admin/apartments/[apartmentId]/load-apartment-detail';
import { ApartmentDetailsContent } from '@/components/apartments/apartment-details-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

interface ApartmentDetailsSectionProps {
  params: Promise<{ apartmentId: string }>;
}

export async function ApartmentDetailsSection({
  params,
}: ApartmentDetailsSectionProps) {
  await requireAdminAccess();
  const { apartmentId } = await params;
  const apartment = await loadApartmentDetail(apartmentId);

  if (!apartment) {
    return <p>Nie znaleziono mieszkania</p>;
  }

  return (
    <ApartmentDetailsContent
      apartmentId={apartmentId}
      initialApartment={apartment}
    />
  );
}
