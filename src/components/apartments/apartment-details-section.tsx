import { notFound } from 'next/navigation';

import { ApartmentDetailsContent } from '@/components/apartments/apartment-details-content';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { loadApartmentDetail } from '@/lib/apartments/queries/load-apartment-detail';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { getRequestNow } from '@/lib/framework/request-now';

interface ApartmentDetailsSectionProps {
  params: Promise<{ apartmentId: string }>;
}

export async function ApartmentDetailsSection({
  params,
}: ApartmentDetailsSectionProps) {
  await requireAdminAccess();
  const { apartmentId } = await params;
  const apartment = await loadApartmentDetail(
    apartmentId,
    await getRequestNow()
  );

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
