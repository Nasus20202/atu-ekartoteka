export interface ErrorExportEntry {
  hoaId: string;
  errors: string[];
  warnings: {
    apartmentExternalId?: string;
    period?: string;
    message: string;
  }[];
}

function pluralise(
  count: number,
  singular: string,
  plural: string,
  genitive: string
): string {
  if (count === 1) return `${count} ${singular}`;
  if (count >= 2 && count <= 4) return `${count} ${plural}`;
  return `${count} ${genitive}`;
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
    `Łącznie: ${pluralise(entries.length, 'wspólnota', 'wspólnoty', 'wspólnot')}, ${pluralise(totalErrors, 'błąd', 'błędy', 'błędów')}, ${pluralise(totalWarnings, 'ostrzeżenie', 'ostrzeżenia', 'ostrzeżeń')}`
  );

  return parts.join('\n');
}
