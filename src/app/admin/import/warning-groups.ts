import {
  groupByKind,
  type IssueGroupInfo,
} from '@/app/admin/import/issue-groups';
import type { ImportWarning, ImportWarningKind } from '@/lib/import/types';

// Insertion order is the display order of the groups
export const WARNING_GROUPS: Record<ImportWarningKind, IssueGroupInfo> = {
  'charges-mismatch': {
    title: 'Naliczenia a wpłaty',
    description:
      'Suma naliczeń z nal_czynsz.txt nie zgadza się z naliczeniami miesięcznymi z wplaty.txt. Aplikacja używa sum naliczeń, więc wartości z wpłat są pomijane.',
  },
  'opening-balance-file': {
    title: 'Saldo otwarcia a zamknięcie z pliku',
    description:
      'Saldo otwarcia roku nie zgadza się z saldem zamknięcia poprzedniego roku z pliku.',
  },
  'opening-balance-calculated': {
    title: 'Saldo otwarcia a wyliczone saldo',
    description:
      'Saldo otwarcia roku nie zgadza się z saldem zamknięcia poprzedniego roku wyliczonym z naliczeń.',
  },
  'line-total': {
    title: 'Kwoty linii naliczeń',
    description:
      'Kwota linii w nal_czynsz.txt nie równa się ilości pomnożonej przez cenę jednostkową.',
  },
  'skipped-records': {
    title: 'Pominięte rekordy',
    description:
      'Rekordy właścicieli i lokali, których nie ma w lok.txt ani w bazie, nie zostały zaimportowane.',
  },
};

export function groupWarnings(warnings: ImportWarning[]) {
  return groupByKind(warnings, WARNING_GROUPS);
}
