import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import {
  formatCountPl,
  type PolishPluralForms,
} from '@/lib/shared/utils/pluralize';

const ERROR_FORMS: PolishPluralForms = {
  one: 'błąd',
  few: 'błędy',
  many: 'błędów',
};
const WARNING_FORMS: PolishPluralForms = {
  one: 'ostrzeżenie',
  few: 'ostrzeżenia',
  many: 'ostrzeżeń',
};
const LABELS = { error: 'BŁĄD', warning: 'OSTRZEŻENIE' } as const;

export interface FileFindings {
  fileName: string;
  errors: SettlementIssue[];
  warnings: SettlementIssue[];
}

const line = ({
  severity,
  page,
  apartmentExternalId,
  message,
}: SettlementIssue) =>
  [
    LABELS[severity],
    page === undefined ? '' : `str. ${page}`,
    apartmentExternalId ?? '',
    message,
  ].join('|');

/** Every finding as text, file by file; empty when there is none. */
export function serialiseSettlementFindings(files: FileFindings[]): string {
  const affected = files.filter(
    (file) => file.errors.length + file.warnings.length > 0
  );
  if (affected.length === 0) return '';

  const count = (key: 'errors' | 'warnings') =>
    affected.reduce((sum, file) => sum + file[key].length, 0);

  return [
    ...affected.flatMap((file) => [
      `=== Plik: ${file.fileName} ===`,
      ...[...file.errors, ...file.warnings].map(line),
      '',
    ]),
    '---',
    `Łącznie: ${formatCountPl(count('errors'), ERROR_FORMS)}, ${formatCountPl(count('warnings'), WARNING_FORMS)}`,
  ].join('\n');
}
