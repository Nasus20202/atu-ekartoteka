import { notFound } from 'next/navigation';

import { ApartmentDetailsContent } from '@/components/apartments/apartment-details-content';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { loadApartmentDetail } from '@/lib/queries/apartments/load-apartment-detail';

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
    notFound();
  }

  return (
    <div className={REVEAL_CLASS}>
      <ApartmentDetailsContent
        apartmentId={apartmentId}
        initialApartment={apartment}
      />
    </div>
  );
}
