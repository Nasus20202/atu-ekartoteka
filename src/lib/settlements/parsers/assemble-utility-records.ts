import type {
  MeterRow,
  ParsedUtilityRecord,
} from '@/lib/settlements/types/utility-settlement';

const recordKey = (record: ParsedUtilityRecord) =>
  JSON.stringify([
    record.apartmentExternalId,
    record.printedOwner,
    record.periodFrom,
    record.periodTo,
  ]);

// Pages repeat the meter table; identical rows are one row
const distinctReadings = (readings: MeterRow[]) => [
  ...new Map(
    readings.map((reading) => [
      JSON.stringify({
        ...reading,
        startValue: reading.startValue.toString(),
        endValue: reading.endValue.toString(),
        consumption: reading.consumption.toString(),
      }),
      reading,
    ])
  ).values(),
];

/** Builds one record per apartment, owner and period from the page records. */
export function assembleUtilityRecords(
  pageRecords: ParsedUtilityRecord[]
): ParsedUtilityRecord[] {
  const records = new Map<string, ParsedUtilityRecord>();

  for (const part of pageRecords) {
    const key = recordKey(part);
    const record = records.get(key);
    records.set(
      key,
      record
        ? {
            ...record,
            issuedOn:
              part.issuedOn > record.issuedOn ? part.issuedOn : record.issuedOn,
            totalAmount: record.totalAmount.plus(part.totalAmount),
            lines: [...record.lines, ...part.lines],
            summaries: [...record.summaries, ...part.summaries],
            readings: [...record.readings, ...part.readings],
            pageTotals: [...record.pageTotals, ...part.pageTotals],
          }
        : part
    );
  }

  return [...records.values()].map((record) => ({
    ...record,
    readings: distinctReadings(record.readings),
  }));
}
