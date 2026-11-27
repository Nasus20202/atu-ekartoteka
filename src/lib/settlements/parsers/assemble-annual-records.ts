import type { ParsedAnnualRecord } from '@/lib/settlements/types/annual-settlement';

const recordKey = (record: ParsedAnnualRecord) =>
  JSON.stringify([
    record.apartmentLabel,
    record.printedOwner,
    record.periodFrom,
    record.periodTo,
  ]);

/** Builds one record per apartment, owner and period from the printed blocks. */
export function assembleAnnualRecords(
  blocks: ParsedAnnualRecord[]
): ParsedAnnualRecord[] {
  const records = new Map<string, ParsedAnnualRecord>();

  for (const block of blocks) {
    const key = recordKey(block);
    const record = records.get(key);
    records.set(
      key,
      record
        ? {
            ...record,
            issuedOn:
              block.issuedOn > record.issuedOn
                ? block.issuedOn
                : record.issuedOn,
            totalAmount: record.totalAmount.plus(block.totalAmount),
            items: [...record.items, ...block.items],
            apartmentTotals: [
              ...record.apartmentTotals,
              ...block.apartmentTotals,
            ],
          }
        : block
    );
  }

  return [...records.values()];
}
