import { TableCell, TableRow } from '@/components/ui/table';
import type { MeterReadingDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatDay } from '@/lib/settlements/rules/format';
import { formatVolume } from '@/lib/settlements/rules/view-format';

interface Props {
  reading: MeterReadingDto;
}

export function ReadingRow({ reading }: Props) {
  return (
    <TableRow>
      <TableCell>
        <div>{reading.label}</div>
        <div className="text-muted-foreground">{reading.device}</div>
      </TableCell>
      <TableCell>{reading.serialNumber}</TableCell>
      <TableCell className="text-right">
        {formatDay(reading.startDate)}
      </TableCell>
      <TableCell className="text-right">
        {formatVolume(reading.startValue)}
      </TableCell>
      <TableCell className="text-right">{formatDay(reading.endDate)}</TableCell>
      <TableCell className="text-right">
        {formatVolume(reading.endValue)}
      </TableCell>
      <TableCell className="text-right font-semibold">
        {formatVolume(reading.consumption, reading.unit)}
      </TableCell>
    </TableRow>
  );
}
