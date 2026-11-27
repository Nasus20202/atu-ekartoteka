import { redirect } from 'next/navigation';

import { loadDefaultApartmentId } from '@/app/dashboard/settlements/load-default-apartment-id';
import { PageHeader } from '@/components/layout/page-header';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { EmptyView } from '@/components/settlements/empty-view';
import { apartmentSettlementsPath } from '@/components/settlements/settlement-view-key';

/** Sends the tenant to their first apartment. */
export async function SettlementsEntry() {
  const apartmentId = await loadDefaultApartmentId();
  if (apartmentId) redirect(apartmentSettlementsPath(apartmentId));

  return (
    <div className={REVEAL_CLASS}>
      <PageHeader title="Rozliczenia" />
      <EmptyView message="Nie masz przypisanych lokali." />
    </div>
  );
}
