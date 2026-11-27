/** Preview results of one readable and one unreadable file. */

import type { SettlementPreviewFileDto } from '@/lib/settlements/dto/settlement-import-dto';

export const record = {
  key: 'key-1',
  apartmentExternalId: 'TST01-1',
  apartmentLabel: 'TST01-1',
  printedOwner: 'Kowalska Anna D',
  matchedOwner: 'Kowalska Anna',
  periodFrom: '2022-05-01',
  periodTo: '2022-09-30',
  totalAmount: '-150.40',
  status: 'changed' as const,
  confirmations: ['owner-annotation' as const, 'replace' as const],
};

export const good: SettlementPreviewFileDto = {
  fileName: 'good.pdf',
  documentType: 'utility',
  errors: [],
  warnings: [
    {
      kind: 'rounding',
      severity: 'warning',
      fileName: 'good.pdf',
      page: 3,
      message: 'różnica',
    },
  ],
  records: [record],
};

export const bad: SettlementPreviewFileDto = {
  fileName: 'bad.pdf',
  documentType: null,
  errors: [
    {
      kind: 'unknown-document',
      severity: 'error',
      fileName: 'bad.pdf',
      message: 'Nierozpoznany dokument',
    },
  ],
  warnings: [],
  records: [],
};
