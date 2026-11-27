import type { SettlementPreviewRecordDto } from '@/lib/settlements/dto/settlement-import-dto';
import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type {
  ConfirmationReason,
  SettlementRecordStatus,
} from '@/lib/settlements/types/prepared-file';

export const DOCUMENT_LABELS: Record<SettlementDocumentType, string> = {
  utility: 'Rozliczenie mediów',
  annual: 'Koszty rzeczywiste',
};
export const UNKNOWN_DOCUMENT_LABEL = 'Nierozpoznany';

export const STATUS_LABELS: Record<SettlementRecordStatus, string> = {
  new: 'Nowe',
  changed: 'Zmienione',
  unchanged: 'Bez zmian',
  blocked: 'Zablokowane',
};

export const confirmationLabel = (
  reason: ConfirmationReason,
  record: SettlementPreviewRecordDto
) =>
  reason === 'replace'
    ? `Zastąp zapisane rozliczenie: ${record.apartmentLabel}, ${record.printedOwner}`
    : `Nazwa „${record.printedOwner}” z pliku to właściciel „${record.matchedOwner}” lokalu ${record.apartmentLabel}`;

export const confirmationId = (key: string, reason: ConfirmationReason) =>
  `${key}-${reason}`;
