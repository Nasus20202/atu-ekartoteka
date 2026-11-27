import type { SettlementConfirmation } from '@/lib/settlements/dto/settlement-import-dto';
import type {
  CheckedFile,
  ConfirmationReason,
} from '@/lib/settlements/types/prepared-file';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import { errorIssue, recordSubject } from '@/lib/settlements/validation/issues';

const MESSAGES: Record<ConfirmationReason, string> = {
  'owner-annotation':
    'wymaga potwierdzenia, że nazwa właściciela z pliku oznacza ten lokal.',
  replace: 'wymaga potwierdzenia zastąpienia zapisanego rozliczenia.',
};

export function findMissingConfirmations(
  { fileName, records }: CheckedFile,
  given: SettlementConfirmation[]
): SettlementIssue[] {
  return records.flatMap((entry) =>
    entry.confirmations
      .filter(
        (reason) =>
          !given.some((c) => c.key === entry.key && c.reason === reason)
      )
      .map((reason) =>
        errorIssue(
          {
            fileName,
            apartmentExternalId: entry.apartment?.externalApartmentId,
            subject: recordSubject(entry.apartmentLabel, entry.record),
          },
          'confirmation',
          MESSAGES[reason]
        )
      )
  );
}
