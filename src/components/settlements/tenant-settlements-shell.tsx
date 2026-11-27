'use client';

import { PageHeader } from '@/components/layout/page-header';
import { DownloadSettlementPdfButton } from '@/components/pdf/download-settlement-pdf-button';
import { ApartmentSelect } from '@/components/settlements/apartment-select';
import { SettlementViews } from '@/components/settlements/settlement-views';
import { useSettlementView } from '@/components/settlements/use-settlement-view';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';

interface Props {
  apartmentId: string;
  apartments: Array<{ value: string; label: string }>;
  owner: string | null;
  hoaName: string;
  data: ApartmentSettlementsDto;
}

export function TenantSettlementsShell({
  apartmentId,
  apartments,
  owner,
  hoaName,
  data,
}: Props) {
  const { view, setView } = useSettlementView();
  const label =
    apartments.find(({ value }) => value === apartmentId)?.label ?? '';

  return (
    <>
      <PageHeader
        title="Rozliczenia"
        description={[label, owner].filter(Boolean).join(' · ')}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {apartments.length > 1 && (
              <ApartmentSelect apartmentId={apartmentId} options={apartments} />
            )}
            <DownloadSettlementPdfButton
              view={view}
              data={data}
              apartmentLabel={label}
              hoaName={hoaName}
            />
          </div>
        }
      />
      <SettlementViews data={data} view={view} onViewChange={setView} />
    </>
  );
}
