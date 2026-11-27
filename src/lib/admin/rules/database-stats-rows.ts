import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import type { DatabaseStatsDto } from '@/lib/admin/dto/database-stats-dto';
import {
  EMPTY_VALUE,
  formatChangeDate,
  formatCount,
  formatDayOrDash,
  formatRange,
  type RangePrecision,
} from '@/lib/admin/rules/stats-format';

export interface SummaryRow {
  label: string;
  count: string;
  /** Secondary text under the count, such as the number of active apartments. */
  detail: string | null;
  range: string;
  changedAt: string;
}

interface SummaryOptions {
  detail?: string;
  precision?: RangePrecision;
}

function summaryRow(
  label: string,
  data: DatabaseStatsDto[keyof DatabaseStatsDto],
  { detail, precision = 'day' }: SummaryOptions = {}
): SummaryRow {
  return {
    label,
    count: formatCount(data.count),
    detail: detail ?? null,
    range: formatRange(data.rangeFrom, data.rangeTo, precision),
    changedAt: data.lastChangedAt
      ? formatChangeDate(data.lastChangedAt)
      : EMPTY_VALUE,
  };
}

/** One row per data type, in the order of the summary table. */
export function buildSummaryRows(stats: DatabaseStatsDto): SummaryRow[] {
  return [
    summaryRow('Wspólnoty', stats.hoa),
    summaryRow('Mieszkania', stats.apartments, {
      detail: `aktywne: ${formatCount(stats.apartments.active)}`,
    }),
    summaryRow('Użytkownicy', stats.users),
    summaryRow('Naliczenia', stats.charges, { precision: 'month' }),
    summaryRow('Powiadomienia', stats.notifications),
    summaryRow('Wpłaty', stats.payments),
    summaryRow('Rozliczenia mediów', stats.utilitySettlements),
    summaryRow('Odczyty liczników', stats.meterReadings),
    summaryRow('Koszty rzeczywiste', stats.annualSettlements),
  ];
}

export interface DataDateLine {
  label: string;
  value: string;
}

const SHARED_DATE_LABEL = 'Dane na dzień';

/**
 * The data-as-of dates of an association, each labelled with its data type.
 * When all three are the same (or all missing), one line with the shared date.
 */
export function buildDataDateLines(
  association: AssociationStatsDto
): DataDateLine[] {
  const lines: DataDateLine[] = [
    {
      label: 'Mieszkania',
      value: formatDayOrDash(association.apartmentsDataDate),
    },
    {
      label: 'Naliczenia',
      value: formatDayOrDash(association.chargesDataDate),
    },
    {
      label: 'Powiadomienia',
      value: formatDayOrDash(association.notificationsDataDate),
    },
  ];

  const [first] = lines;
  const allEqual = lines.every((line) => line.value === first.value);
  return allEqual ? [{ label: SHARED_DATE_LABEL, value: first.value }] : lines;
}
