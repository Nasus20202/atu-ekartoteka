import type { ConfirmOptions } from '@/components/providers/confirm-dialog';

export const CLEAN_IMPORT_CONFIRMATION: ConfirmOptions = {
  title: 'Potwierdzenie czystego importu',
  description:
    'Czy na pewno chcesz wykonać czysty import? Ta operacja usunie wszystkie istniejące naliczenia, powiadomienia o opłatach i wpłaty. Mieszkania i użytkownicy nie zostaną usunięci.',
  confirmText: 'Tak, usuń i importuj',
  cancelText: 'Anuluj',
  variant: 'destructive',
};

export const SKIP_VALIDATION_CONFIRMATION: ConfirmOptions = {
  title: 'Pominięcie walidacji',
  description:
    'Czy na pewno chcesz pominąć walidację danych? Import może zawierać błędne lub niespójne dane.',
  confirmText: 'Tak, pomiń walidację',
  cancelText: 'Anuluj',
  variant: 'destructive',
};

export const SKIP_VALIDATION_FINAL_CONFIRMATION: ConfirmOptions = {
  title: 'Potwierdzenie – pominięcie walidacji',
  description:
    'To jest ostateczne potwierdzenie. Importowane dane nie zostaną sprawdzone pod kątem poprawności sum i sald. Czy kontynuować?',
  confirmText: 'Potwierdzam – pomiń walidację',
  cancelText: 'Anuluj',
  variant: 'destructive',
};
