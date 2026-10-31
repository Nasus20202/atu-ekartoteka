export const CHART_COLORS = {
  payments: 'hsl(var(--primary))',
  charges: 'hsl(var(--destructive))',
  balance: 'hsl(var(--foreground))',
  trend: 'hsl(var(--primary))',
  grid: 'hsl(var(--border))',
  balancePositive: 'hsl(142 71% 40%)',
  balanceNegative: 'hsl(0 72% 51%)',
  zeroLine: 'hsl(var(--muted-foreground))',
  tooltip: 'hsl(var(--card))',
  tooltipText: 'hsl(var(--foreground))',
  tooltipBorder: 'hsl(var(--border))',
  muted: 'hsl(var(--muted-foreground))',
};

const SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(173 58% 39%)',
  'hsl(35 92% 50%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
] as const;

export function getSeriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}
