import { Check, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface HoaReorderBarProps {
  customized: boolean;
  onReset: () => void;
  onDone: () => void;
}

export function HoaReorderBar({
  customized,
  onReset,
  onDone,
}: HoaReorderBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm">
      <p className="max-w-prose">
        <span className="font-semibold">Zmieniasz kolejność wspólnot.</span>{' '}
        Przeciągnij wiersz w nowe miejsce albo użyj strzałek. Kolejność zapisuje
        się w tej przeglądarce.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!customized}
          onClick={onReset}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Przywróć domyślną
        </Button>
        <Button type="button" size="sm" onClick={onDone}>
          <Check className="mr-2 h-4 w-4" />
          Gotowe
        </Button>
      </div>
    </div>
  );
}
