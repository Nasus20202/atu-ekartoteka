import { loadTenantSettlements } from '@/app/dashboard/settlements/load-tenant-settlements';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import type { SettlementSearchParams } from '@/components/settlements/settlement-search-params';
import { TenantSettlementsShell } from '@/components/settlements/tenant-settlements-shell';
import { formatApartmentLabel } from '@/lib/shared/utils/apartment-label';

interface Props {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<SettlementSearchParams>;
}

export async function TenantSettlementsSection({
  params,
  searchParams,
}: Props) {
  const { apartmentId } = await params;
  const { apartments, apartment, data } = await loadTenantSettlements(
    apartmentId,
    await searchParams
  );

  return (
    <div key={apartment.id} className={REVEAL_CLASS}>
      <TenantSettlementsShell
        apartmentId={apartment.id}
        apartments={apartments.map((own) => ({
          value: own.id,
          label: formatApartmentLabel(own),
        }))}
        owner={apartment.owner}
        hoaName={apartment.homeownersAssociation.name}
        data={data}
      />
    </div>
  );
}
