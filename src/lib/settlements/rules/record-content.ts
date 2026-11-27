import type {
  AnnualContent,
  UtilityContent,
} from '@/lib/settlements/types/record-content';

// The order of entries carries no meaning
const sorted = (entries: unknown[][]) =>
  entries.map((entry) => JSON.stringify(entry)).sort();

/**
 * The stored values of a record in a comparable form. The issue date and the
 * file name are left out: a reprint of the same settlement changes nothing.
 */
export function canonicalContent(
  content: UtilityContent | AnnualContent
): string {
  const header = [
    content.printedOwner,
    content.periodFrom,
    content.periodTo,
    content.totalAmount.toString(),
  ];
  if ('items' in content) {
    return JSON.stringify([
      header,
      sorted(
        content.items.map((i) => [
          i.title,
          i.basisDescription,
          i.periodFrom,
          i.periodTo,
          i.communityAmount.toString(),
          i.flatBasis.toString(),
          i.communityBasis.toString(),
          i.coefficient.toString(),
          i.amount.toString(),
        ])
      ),
    ]);
  }
  return JSON.stringify([
    header,
    sorted(
      content.lines.map((l) => [
        l.kind,
        l.description,
        l.dateFrom,
        l.dateTo,
        l.quantity.toString(),
        l.unitPrice.toString(),
        l.amount.toString(),
      ])
    ),
    sorted(
      content.summaries.map((s) => [
        s.code,
        s.consumption.toString(),
        s.advanceQuantity.toString(),
        s.difference.toString(),
        s.amount.toString(),
      ])
    ),
    sorted(
      content.readings.map((r) => [
        r.device,
        r.serialNumber,
        r.label,
        r.unit,
        r.startDate,
        r.startValue.toString(),
        r.endDate,
        r.endValue.toString(),
        r.consumption.toString(),
      ])
    ),
  ]);
}
