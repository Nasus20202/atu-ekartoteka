import { Info } from 'lucide-react';

export function HoaNotice({ text }: { text: string }) {
  return (
    <div
      role="note"
      aria-label="Zawiadomienie wspólnoty"
      className="flex gap-2 border-t bg-muted/50 px-4 py-3 text-xs text-muted-foreground"
    >
      <Info aria-hidden className="mt-px h-4 w-4 shrink-0" />
      <p className="min-w-0 whitespace-pre-line break-words">{text}</p>
    </div>
  );
}
