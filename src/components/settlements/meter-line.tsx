import type { MeterReadingDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatVolume } from '@/lib/settlements/rules/view-format';

interface Props {
  meter: MeterReadingDto;
}

export function MeterLine({ meter }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      Licznik nr {meter.serialNumber}, odczyty: {formatVolume(meter.startValue)}{' '}
      → {formatVolume(meter.endValue, meter.unit)}
    </div>
  );
}
