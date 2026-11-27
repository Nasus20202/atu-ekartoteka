import { Card, CardContent } from '@/components/ui/card';
import type { MeterReadingDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatDay } from '@/lib/settlements/rules/format';
import { formatUnit, formatVolume } from '@/lib/settlements/rules/view-format';

interface Props {
  meter: MeterReadingDto;
  heading: string;
}

export function MeterCard({ meter, heading }: Props) {
  return (
    <Card
      role="region"
      aria-label={`${heading}, licznik ${meter.serialNumber}`}
    >
      <CardContent className="p-6">
        <h2 className="font-semibold">{heading}</h2>
        <div className="text-muted-foreground">
          Licznik nr {meter.serialNumber}
        </div>
        <div className="mt-4 text-4xl font-bold tabular-nums">
          {formatVolume(meter.endValue)}{' '}
          <span className="text-lg font-medium">{formatUnit(meter.unit)}</span>
        </div>
        <div className="text-muted-foreground">
          stan na {formatDay(meter.endDate)}
        </div>
        <div className="mt-4 border-t pt-3">
          Zużycie w okresie:{' '}
          <strong>{formatVolume(meter.consumption, meter.unit)}</strong>
        </div>
      </CardContent>
    </Card>
  );
}
