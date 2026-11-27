import { PdfTable } from '@/components/pdf/pdf-table';
import type { MeterReadingDto } from '@/lib/settlements/dto/settlement-view-dto';
import { formatDay } from '@/lib/settlements/rules/format';
import { formatVolume } from '@/lib/settlements/rules/view-format';

const COLUMNS = [
  { header: 'Urządzenie' },
  { header: 'Nr seryjny', width: 62 },
  { header: 'Data pocz.', width: 58 },
  { header: 'Stan pocz.', width: 56 },
  { header: 'Data końc.', width: 58 },
  { header: 'Stan końc.', width: 56 },
  { header: 'Zużycie', width: 70 },
];

interface Props {
  readings: MeterReadingDto[];
}

export function ReadingsPdfTable({ readings }: Props) {
  return (
    <PdfTable
      columns={COLUMNS}
      rows={readings.map((reading) => ({
        key: reading.id,
        cells: [
          { lines: [reading.label, reading.device] },
          reading.serialNumber,
          formatDay(reading.startDate),
          formatVolume(reading.startValue),
          formatDay(reading.endDate),
          formatVolume(reading.endValue),
          formatVolume(reading.consumption, reading.unit),
        ],
      }))}
    />
  );
}
