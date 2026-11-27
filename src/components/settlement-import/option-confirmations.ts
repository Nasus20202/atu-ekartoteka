import type { ConfirmOptions } from '@/components/providers/confirm-dialog';
import type { SettlementImportOptions } from '@/lib/settlements/types/prepared-file';

/** What the admin confirms before an option is switched on. */
export const OPTION_CONFIRMATIONS: Record<
  keyof SettlementImportOptions,
  ConfirmOptions[]
> = {
  cleanImport: [
    {
      title: 'Ostrzeżenie – czysty import rozliczeń',
      description:
        'Czysty import usunie zapisane rozliczenia importowanych wspólnot tego samego rodzaju i z tych samych okresów, co w plikach. Tej operacji nie można cofnąć.',
      confirmText: 'Rozumiem, dalej',
      cancelText: 'Anuluj',
      variant: 'destructive',
    },
    {
      title: 'Potwierdzenie – czysty import rozliczeń',
      description:
        'To jest ostateczne potwierdzenie. Także rozliczenia lokali, których nie ma w plikach, zostaną usunięte z tych okresów. Czy kontynuować?',
      confirmText: 'Potwierdzam – czysty import',
      cancelText: 'Anuluj',
      variant: 'destructive',
    },
  ],
  skipValidation: [
    {
      title: 'Pominięcie walidacji rozliczeń',
      description:
        'Błędy sum i niezgodności z zapisanymi danymi będą tylko ostrzeżeniami i nie zablokują importu.',
      confirmText: 'Tak, pomiń walidację',
      cancelText: 'Anuluj',
      variant: 'destructive',
    },
    {
      title: 'Potwierdzenie – pominięcie walidacji',
      description:
        'To jest ostateczne potwierdzenie. Zapisane mogą zostać błędne lub niespójne dane. Czy kontynuować?',
      confirmText: 'Potwierdzam – pomiń walidację',
      cancelText: 'Anuluj',
      variant: 'destructive',
    },
  ],
};

export const cleanImportQuestion = (removals: number): ConfirmOptions => ({
  title: 'Czysty import rozliczeń',
  description: `Zapisane rozliczenia do usunięcia: ${removals}. Czy na pewno chcesz je usunąć i zaimportować pliki?`,
  confirmText: 'Tak, usuń i importuj',
  cancelText: 'Anuluj',
  variant: 'destructive',
});
