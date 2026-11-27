import { isoToDate } from '@/lib/settlements/rules/periods';
import type { ParsedAnnualRecord } from '@/lib/settlements/types/annual-settlement';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';

const numbered = <T>(entries: T[]) =>
  entries.map((entry, index) => ({ ...entry, lineNo: index + 1 }));

const header = (
  record: ParsedUtilityRecord | ParsedAnnualRecord,
  sourceFileName: string
) => ({
  periodFrom: isoToDate(record.periodFrom),
  periodTo: isoToDate(record.periodTo),
  issuedOn: isoToDate(record.issuedOn),
  printedOwner: record.printedOwner,
  totalAmount: record.totalAmount,
  sourceFileName,
});

export function utilityData(record: ParsedUtilityRecord, fileName: string) {
  return {
    header: header(record, fileName),
    summaries: numbered(record.summaries),
    lines: numbered(
      record.lines.map((line) => ({
        ...line,
        dateFrom: isoToDate(line.dateFrom),
        dateTo: isoToDate(line.dateTo),
      }))
    ),
    readings: numbered(
      record.readings.map((reading) => ({
        ...reading,
        startDate: isoToDate(reading.startDate),
        endDate: isoToDate(reading.endDate),
      }))
    ),
  };
}

export function annualData(record: ParsedAnnualRecord, fileName: string) {
  return {
    header: header(record, fileName),
    items: numbered(
      record.items.map((item) => ({
        title: item.title,
        basisDescription: item.basisDescription,
        periodFrom: isoToDate(item.periodFrom),
        periodTo: isoToDate(item.periodTo),
        communityAmount: item.communityAmount,
        flatBasis: item.flatBasis,
        communityBasis: item.communityBasis,
        coefficient: item.coefficient,
        amount: item.amount,
      }))
    ),
  };
}
