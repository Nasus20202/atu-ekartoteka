import { DocumentDetails } from '@/components/settlements/document-details';
import { EmptyView } from '@/components/settlements/empty-view';
import { MeterCard } from '@/components/settlements/meter-card';
import { ReadingsTable } from '@/components/settlements/readings-table';
import type {
  ApartmentSettlementsDto,
  UtilitySettlementDto,
} from '@/lib/settlements/dto/settlement-view-dto';
import { periodMeters } from '@/lib/settlements/rules/period-meters';

interface Props extends Pick<
  ApartmentSettlementsDto,
  'readings' | 'readingMeters' | 'readingsQuery'
> {
  settlement: UtilitySettlementDto;
  /** True while only one period is visible, so the table has nothing earlier */
  singlePeriod: boolean;
}

export function MetersView({
  settlement,
  singlePeriod,
  ...readingsTable
}: Props) {
  const meters = periodMeters(settlement);

  return (
    <div className="space-y-4">
      {meters.length === 0 ? (
        <EmptyView message="Brak odczytów liczników w tym okresie." />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
          {meters.map(({ meter, heading }) => (
            <MeterCard key={meter.id} meter={meter} heading={heading} />
          ))}
        </div>
      )}
      {readingsTable.readingMeters.length > 0 && (
        <ReadingsTable {...readingsTable} />
      )}
      {singlePeriod && (
        <p className="text-sm text-muted-foreground">
          Kolejne okresy pojawią się tutaj po następnych odczytach.
        </p>
      )}
      <DocumentDetails {...settlement} />
    </div>
  );
}
