import {
  groupByKind,
  type IssueGroupInfo,
} from '@/components/import/issue-groups';
import type {
  SettlementIssue,
  SettlementIssueKind,
} from '@/lib/settlements/types/settlement-issue';

// Insertion order is the display order of the groups
const FINDING_GROUPS: Record<SettlementIssueKind, IssueGroupInfo> = {
  unreadable: {
    title: 'Pliki nieodczytane',
    description: 'Pliku nie udało się odczytać.',
  },
  'unknown-document': {
    title: 'Nierozpoznane dokumenty',
    description: 'Obsługiwane są rozliczenia mediów i kosztów rzeczywistych.',
  },
  unrecognised: {
    title: 'Nierozpoznana treść',
    description: 'Część rozliczenia ma układ, którego aplikacja nie zna.',
  },
  duplicate: {
    title: 'Powtórzone rozliczenia',
    description: 'To samo rozliczenie występuje więcej niż raz.',
  },
  match: {
    title: 'Niedopasowane lokale',
    description:
      'Rozliczenia nie można przypisać do jednego lokalu i właściciela.',
  },
  inconsistent: {
    title: 'Sprzeczne dane w pliku',
    description: 'Wartości w pliku nie zgadzają się ze sobą.',
  },
  unstorable: {
    title: 'Wartości nie do zapisania',
    description: 'Wartości są dokładniejsze lub większe, niż można zapisać.',
  },
  charges: {
    title: 'Niezgodność z naliczeniami',
    description: 'Wartości z pliku różnią się od zapisanych naliczeń.',
  },
  overlap: {
    title: 'Nakładające się okresy',
    description: 'Lokal ma już rozliczenie obejmujące część tego okresu.',
  },
  confirmation: {
    title: 'Brak potwierdzenia',
    description: 'Pliku nie zapisano, bo nie potwierdzono wszystkich zmian.',
  },
  aborted: {
    title: 'Przerwany czysty import',
    description: 'Nic nie zostało usunięte ani zapisane.',
  },
  database: {
    title: 'Błędy zapisu w bazie',
    description: 'Pliku nie udało się zapisać.',
  },
  'not-verified': {
    title: 'Niezweryfikowane z naliczeniami',
    description: 'Brakuje naliczeń potrzebnych do porównania.',
  },
  rounding: {
    title: 'Różnice zaokrągleń',
    description: 'Zapisywana jest kwota z pliku.',
  },
  'meter-billed': {
    title: 'Zużycie a liczniki',
    description: 'Rozliczone zużycie różni się od odczytów liczników.',
  },
  ungrouped: {
    title: 'Pozycje bez przypisanego medium',
    description: 'Część porównań dla tych rozliczeń została pominięta.',
  },
  community: {
    title: 'Sumy wspólnoty',
    description: 'Kwoty wspólnoty różnią się od sumy naliczeń.',
  },
  continuity: {
    title: 'Ciągłość odczytów',
    description: 'Odczyt różni się od zapisanego z tego samego dnia.',
  },
  serial: {
    title: 'Liczniki w innych lokalach',
    description: 'Numer licznika jest zapisany dla innego lokalu.',
  },
  'owner-period': {
    title: 'Okres właściciela',
    description: 'Okres rozliczenia wykracza poza daty właściciela.',
  },
};

export const groupFindings = (findings: SettlementIssue[]) =>
  groupByKind(findings, FINDING_GROUPS);
