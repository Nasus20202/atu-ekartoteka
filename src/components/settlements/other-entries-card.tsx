import { MeterLine } from '@/components/settlements/meter-line';
import { SettlementLinesTable } from '@/components/settlements/settlement-lines-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type {
  MeterReadingDto,
  SettlementLineDto,
} from '@/lib/settlements/dto/settlement-view-dto';

interface Props {
  lines: SettlementLineDto[];
  meters: MeterReadingDto[];
}

/** Lines and meters that belong to no utility, as printed. */
export function OtherEntriesCard({ lines, meters }: Props) {
  return (
    <Card role="region" aria-label="Pozostałe">
      <CardHeader className="pb-2">
        <h2 className="font-semibold">Pozostałe</h2>
        {meters.map((meter) => (
          <div key={meter.id}>
            <span className="text-sm">{meter.label}</span>
            <MeterLine meter={meter} />
          </div>
        ))}
      </CardHeader>
      {lines.length > 0 && (
        <CardContent>
          <SettlementLinesTable label="Pozostałe pozycje" lines={lines} />
        </CardContent>
      )}
    </Card>
  );
}
