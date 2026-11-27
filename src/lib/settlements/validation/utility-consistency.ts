import { groupByCode } from '@/lib/settlements/rules/group-by-code';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';
import {
  errorIssue,
  type IssueContext,
} from '@/lib/settlements/validation/issues';
import { unstorableValues } from '@/lib/settlements/validation/precision';
import { formatQuantity } from '@/lib/shared/utils';
import { sumDecimals } from '@/lib/shared/utils/sum';

const duplicates = <T>(items: T[], key: (item: T) => unknown[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = JSON.stringify(key(item));
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });
};

function quantityErrors(record: ParsedUtilityRecord): string[] {
  const codes = record.summaries.map((s) => s.code);
  const grouped = record.lines.map((line) => ({
    ...line,
    code: groupByCode(line.description, codes),
  }));
  // A line without a group could belong to any of them
  if (grouped.some((line) => line.code === null)) return [];

  return [...new Set(codes)].flatMap((code) => {
    const rows = record.summaries.filter((s) => s.code === code);
    const checks = [
      ['zużycia', 'CONSUMPTION', rows.map((r) => r.consumption)],
      ['zaliczek', 'ADVANCE', rows.map((r) => r.advanceQuantity)],
    ] as const;

    return checks.flatMap(([name, kind, summary]) => {
      const lines = sumDecimals(
        grouped
          .filter((l) => l.code === code && l.kind === kind)
          .map((l) => l.quantity)
      );
      const stated = sumDecimals([...summary]);
      return lines.equals(stated)
        ? []
        : [
            `${code}: ilość ${name} w pozycjach (${formatQuantity(lines)}) różni się od podsumowania (${formatQuantity(stated)}).`,
          ];
    });
  });
}

/** Contradictions within the file itself; any of them blocks the import. */
export function checkUtilityConsistency(
  record: ParsedUtilityRecord,
  context: IssueContext
): SettlementIssue[] {
  const messages: string[] = [];

  for (const reading of record.readings) {
    if (
      !reading.endValue.minus(reading.startValue).equals(reading.consumption)
    ) {
      messages.push(
        `licznik ${reading.serialNumber}: zużycie ${formatQuantity(reading.consumption)} nie jest różnicą odczytów ${formatQuantity(reading.startValue)} i ${formatQuantity(reading.endValue)}.`
      );
    }
  }
  for (const reading of duplicates(record.readings, (r) => [
    r.device,
    r.serialNumber,
    r.startDate,
    r.endDate,
  ])) {
    messages.push(
      `licznik ${reading.serialNumber}: sprzeczne wiersze odczytów.`
    );
  }
  for (const line of duplicates(record.lines, (l) => [
    l.kind,
    l.description,
    l.dateFrom,
    l.dateTo,
    l.quantity.toString(),
    l.unitPrice.toString(),
    l.amount.toString(),
  ])) {
    messages.push(`pozycja „${line.description}” występuje dwa razy.`);
  }
  for (const row of record.summaries) {
    if (!row.consumption.minus(row.advanceQuantity).equals(row.difference)) {
      messages.push(
        `${row.code}: różnica ${formatQuantity(row.difference)} nie jest zużyciem pomniejszonym o zaliczkę.`
      );
    }
  }
  messages.push(...quantityErrors(record));

  const unstorable = unstorableValues([
    [record.totalAmount, 'amount'],
    ...record.lines.flatMap((l) => [
      [l.quantity, 'quantity'] as const,
      [l.unitPrice, 'amount'] as const,
      [l.amount, 'amount'] as const,
    ]),
    ...record.summaries.flatMap((s) => [
      [s.consumption, 'quantity'] as const,
      [s.advanceQuantity, 'quantity'] as const,
      [s.difference, 'quantity'] as const,
      [s.amount, 'amount'] as const,
    ]),
    ...record.readings.flatMap((r) => [
      [r.startValue, 'reading'] as const,
      [r.endValue, 'reading'] as const,
      [r.consumption, 'reading'] as const,
    ]),
  ] as Parameters<typeof unstorableValues>[0]);
  return [
    ...messages.map((m) => errorIssue(context, 'inconsistent', m)),
    ...unstorable.map((value) =>
      errorIssue(
        context,
        'unstorable',
        `wartość ${formatQuantity(value)} ma więcej cyfr, niż można zapisać.`
      )
    ),
  ];
}
