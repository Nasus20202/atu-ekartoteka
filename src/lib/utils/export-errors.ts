import { formatCountPl, type PolishPluralForms } from '@/lib/utils/pluralize';

const HOA_FORMS: PolishPluralForms = {
  one: 'wspólnota',
  few: 'wspólnoty',
  many: 'wspólnot',
};
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

export interface ErrorExportEntry {
  hoaId: string;
  errors: string[];
  warnings: {
    apartmentExternalId?: string;
    period?: string;
    message: string;
  }[];
}

export function serialiseErrorsToTxt(entries: ErrorExportEntry[]): string {
  if (entries.length === 0) {
    return '';
  }

  const parts: string[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const entry of entries) {
    totalErrors += entry.errors.length;
    totalWarnings += entry.warnings.length;

    parts.push(`=== Wspólnota: ${entry.hoaId} ===`);

    for (const error of entry.errors) {
      parts.push(`BŁĄD|||${error}`);
    }

    for (const warning of entry.warnings) {
      const apartmentId = warning.apartmentExternalId ?? '';
      const period = warning.period ?? '';
      parts.push(`OSTRZEŻENIE|${apartmentId}|${period}|${warning.message}`);
    }

    parts.push('');
  }

  parts.push('---');
  parts.push(
    `Łącznie: ${formatCountPl(entries.length, HOA_FORMS)}, ${formatCountPl(totalErrors, ERROR_FORMS)}, ${formatCountPl(totalWarnings, WARNING_FORMS)}`
  );

  return parts.join('\n');
}
