import { cn } from '@/lib/utils';

// chart area (h-56) + viewport nav (h-8) + gap (space-y-3)
export const NAVIGABLE_CHART_PLACEHOLDER_CLASS = 'h-[16.75rem]';
export const PAYMENT_CHART_PLACEHOLDER_CLASS = 'h-72';

interface ChartPlaceholderProps {
  className: string;
}

export function ChartPlaceholder({ className }: ChartPlaceholderProps) {
  return <div aria-hidden className={cn('w-full', className)} />;
}
