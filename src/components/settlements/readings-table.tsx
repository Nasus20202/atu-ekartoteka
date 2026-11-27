'use client';

import { ReadingRow } from '@/components/settlements/reading-row';
import { SETTLEMENT_PARAMS } from '@/components/settlements/settlement-view-key';
import { useSettlementParams } from '@/components/settlements/use-settlement-params';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';
import type { ReadingSortKey } from '@/lib/settlements/rules/readings-query';
import { toggleSort } from '@/lib/shared/utils/sort';

const ALL_METERS = '';

const COLUMNS: Array<{ key: ReadingSortKey; label: string; end?: boolean }> = [
  { key: 'device', label: 'Urządzenie' },
  { key: 'serialNumber', label: 'Nr seryjny' },
  { key: 'startDate', label: 'Data pocz.', end: true },
  { key: 'startValue', label: 'Stan pocz.', end: true },
  { key: 'endDate', label: 'Data końc.', end: true },
  { key: 'endValue', label: 'Stan końc.', end: true },
  { key: 'consumption', label: 'Zużycie', end: true },
];

type Props = Pick<
  ApartmentSettlementsDto,
  'readings' | 'readingMeters' | 'readingsQuery'
>;

export function ReadingsTable({
  readings,
  readingMeters,
  readingsQuery,
}: Props) {
  const { update } = useSettlementParams();
  const { meter, sort } = readingsQuery;
  const options = [
    { value: ALL_METERS, label: 'Wszystkie liczniki' },
    ...readingMeters.map(({ device, label }) => ({
      value: device,
      label: device === label ? device : `${label} (${device})`,
    })),
  ];

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-2">
        <h2 className="font-semibold">Odczyty</h2>
        {(readingMeters.length > 1 || meter) && (
          <Select
            aria-label="Licznik"
            className="w-64 max-w-full"
            value={meter ?? ALL_METERS}
            options={options}
            onValueChange={(next) =>
              update({ [SETTLEMENT_PARAMS.meter]: next || null })
            }
          />
        )}
      </CardHeader>
      <CardContent>
        <Table aria-label="Odczyty" className="min-w-[820px] tabular-nums">
          <TableHeader>
            <TableRow>
              {COLUMNS.map(({ key, label, end }) => (
                <SortableTableHead
                  key={key}
                  label={label}
                  className={end ? 'text-right' : undefined}
                  direction={sort.key === key ? sort.direction : null}
                  onSort={() => {
                    const next = toggleSort(sort, key);
                    update({
                      [SETTLEMENT_PARAMS.readingSort]: next.key,
                      [SETTLEMENT_PARAMS.readingOrder]: next.direction,
                    });
                  }}
                />
              ))}
            </TableRow>
          </TableHeader>
          {/* Keyed so the rows animate in; the headers keep the focus */}
          <TableBody
            key={`${meter}-${sort.key}-${sort.direction}`}
            className="motion-safe:animate-view-switch motion-reduce:animate-none"
          >
            {readings.map((reading) => (
              <ReadingRow key={reading.id} reading={reading} />
            ))}
            {readings.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="text-center text-muted-foreground"
                >
                  Brak odczytów wybranego licznika.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
