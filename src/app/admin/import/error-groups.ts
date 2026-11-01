import {
  groupByKind,
  type IssueGroupInfo,
} from '@/app/admin/import/issue-groups';
import type { ImportErrorItem, ImportErrorKind } from '@/lib/import/types';

// Insertion order is the display order of the groups
export const ERROR_GROUPS: Record<ImportErrorKind, IssueGroupInfo> = {
  'balance-mismatch': {
    title: 'Saldo zamknięcia wpłat',
    description:
      'Saldo zamknięcia w wplaty.txt nie zgadza się z saldem wyliczonym z salda otwarcia, wpłat i naliczeń.',
  },
  'duplicate-records': {
    title: 'Zduplikowane rekordy',
    description:
      'Ten sam rekord występuje w dwóch plikach tej samej wspólnoty.',
  },
  database: {
    title: 'Błędy zapisu w bazie',
    description: 'Nie udało się zapisać części rekordów w bazie danych.',
  },
  transaction: {
    title: 'Błąd transakcji',
    description:
      'Import wspólnoty został przerwany i jej dane nie zostały zmienione.',
  },
  'missing-files': {
    title: 'Brak plików',
    description: 'Dla wspólnoty nie przesłano żadnego pliku do importu.',
  },
  'file-error': {
    title: 'Pliki nieodczytane lub nierozpoznane',
    description: 'Pliku nie udało się odczytać albo nie został rozpoznany.',
  },
};

export function groupErrors<T extends ImportErrorItem>(errors: T[]) {
  return groupByKind(errors, ERROR_GROUPS);
}
