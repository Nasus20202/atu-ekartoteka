import { Loader2 } from 'lucide-react';

export function ApartmentOptionsLoading() {
  return (
    <div
      role="status"
      className="flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2
        aria-hidden
        className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none"
      />
      Ładowanie mieszkań...
    </div>
  );
}
