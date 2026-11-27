'use client';

import { DownloadSettlementPdfButton } from '@/components/pdf/download-settlement-pdf-button';
import { SettlementViews } from '@/components/settlements/settlement-views';
import { useSettlementView } from '@/components/settlements/use-settlement-view';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';

interface Props {
  data: ApartmentSettlementsDto;
  apartmentLabel: string;
  hoaName: string;
}

/** Every stored settlement of one apartment record, for admins. */
export function AdminSettlementsCard({ data, ...subject }: Props) {
  const { view, setView } = useSettlementView();

  return (
    <Card role="region" aria-label="Rozliczenia">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Rozliczenia</CardTitle>
          <CardDescription>
            Wszystkie zaimportowane rozliczenia tego lokalu
          </CardDescription>
        </div>
        <DownloadSettlementPdfButton view={view} data={data} {...subject} />
      </CardHeader>
      <CardContent>
        <SettlementViews data={data} view={view} onViewChange={setView} />
      </CardContent>
    </Card>
  );
}
