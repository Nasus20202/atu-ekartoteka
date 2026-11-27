import { Bell } from 'lucide-react';

export function NavBadge({ count }: { count?: number }) {
  if (!count) return null;

  return (
    <span
      role="status"
      aria-label={`Głosowania czekające na Twój głos: ${count}`}
      className="inline-flex items-center gap-1 rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold leading-none text-destructive-foreground motion-safe:animate-scale-in"
    >
      <Bell className="h-3 w-3" aria-hidden />
      {count}
    </span>
  );
}
