import { describe, expect, it } from 'vitest';

import {
  formatCompactAmount,
  formatSeriesTooltipAmount,
  formatTooltipAmount,
  formatTooltipLabel,
} from '@/components/charts/chart-formatters';
import { formatCurrency } from '@/lib/utils';

describe('chart formatters', () => {
  it('formats axis amounts compactly', () => {
    expect(formatCompactAmount(1500).replace(/\s/g, ' ')).toBe('1,5 tys. zł');
  });

  it('formats tooltip amounts as currency with the series name', () => {
    expect(formatTooltipAmount('12.5', 'Wpłaty')).toEqual([
      formatCurrency(12.5),
      'Wpłaty',
    ]);
  });

  it('uses the payload name for HOA series tooltips', () => {
    expect(
      formatSeriesTooltipAmount(10, 'apt_apt_1', { name: 'Wspólnota A' })
    ).toEqual([formatCurrency(10), 'Wspólnota A']);
  });

  it('formats tooltip labels as strings', () => {
    expect(formatTooltipLabel(202501)).toBe('202501');
  });
});
