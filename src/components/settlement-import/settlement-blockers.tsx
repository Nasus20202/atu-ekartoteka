import type { ImportBlocker } from '@/components/settlement-import/import-blockers';
import { AnimatedAlert } from '@/components/ui/animated-alert';

const WARNING = 'border-2 border-amber-500 bg-amber-500/10';

interface Props {
  blockers: ImportBlocker[];
  cleanImport: boolean;
}

/** What stops the import, shown next to its button. */
export function SettlementBlockers({ blockers, cleanImport }: Props) {
  const missing = blockers.reduce((total, b) => total + b.missing, 0);

  if (!cleanImport) {
    return (
      <AnimatedAlert show={missing > 0} className={WARNING}>
        Niezaznaczone potwierdzenia: {missing}. Pliki, których dotyczą, zostaną
        pominięte.
      </AnimatedAlert>
    );
  }

  return (
    <AnimatedAlert show={blockers.length > 0} variant="destructive">
      <p className="font-semibold">
        Czysty import wymaga, aby wszystkie pliki były gotowe. Blokują go:
      </p>
      <ul className="my-2 list-disc space-y-1 pl-5">
        {blockers.map((blocker, index) => (
          <li key={index} className="break-all">
            {blocker.fileName} –{' '}
            {blocker.errors > 0
              ? `błędy: ${blocker.errors}`
              : `niezaznaczone potwierdzenia: ${blocker.missing}`}
          </li>
        ))}
      </ul>
      {missing > 0 && <p>Zaznacz brakujące potwierdzenia przy plikach.</p>}
      {blockers.some((b) => b.errors > 0) && (
        <p>
          Pliki z błędami popraw albo usuń z wyboru i sprawdź ponownie. Czysty
          import usunie też rozliczenia z tych samych okresów, które były tylko
          w usuniętych plikach.
        </p>
      )}
    </AnimatedAlert>
  );
}
