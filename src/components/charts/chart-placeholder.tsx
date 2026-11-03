import { cn } from '@/lib/utils';

interface ChartPlaceholderProps {
  className: string;
}

export function ChartPlaceholder({ className }: ChartPlaceholderProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'w-full rounded-lg bg-muted motion-safe:animate-pulse',
        className
      )}
    />
  );
}
