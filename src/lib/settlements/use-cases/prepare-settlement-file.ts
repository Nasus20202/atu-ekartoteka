import { parseSettlementPdf } from '@/lib/settlements/parsers/parse-settlement-pdf';
import type { ParsedDocument } from '@/lib/settlements/types/parsed-document';
import type {
  PreparedFile,
  SettlementRecord,
  SettlementUpload,
} from '@/lib/settlements/types/prepared-file';
import { matchSettlementRecord } from '@/lib/settlements/use-cases/match-settlement-record';
import { checkOwnerTotals } from '@/lib/settlements/validation/annual-consistency';

const entries = (document: ParsedDocument): SettlementRecord[] => {
  if (document.type === 'utility') {
    return document.records.map((record) => ({ type: 'utility', record }));
  }
  return document.type === 'annual'
    ? document.records.map((record) => ({ type: 'annual', record }))
    : [];
};

/** Reads one uploaded file and matches its records to apartments. */
export async function prepareSettlementFile({
  fileName,
  data,
}: SettlementUpload): Promise<PreparedFile> {
  const document = await parseSettlementPdf(data);
  const records = [];
  for (const entry of entries(document)) {
    records.push(await matchSettlementRecord(entry, fileName));
  }

  return {
    fileName,
    documentType: document.type,
    records,
    issues: [
      ...document.problems.map((problem) => ({
        ...problem,
        severity: 'error' as const,
        fileName,
      })),
      ...(document.type === 'annual'
        ? checkOwnerTotals(document.ownerTotals, fileName)
        : []),
    ],
  };
}
