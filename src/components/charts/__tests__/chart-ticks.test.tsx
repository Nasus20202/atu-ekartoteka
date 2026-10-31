import { render } from '@testing-library/react';
import type { YAxisTickContentProps } from 'recharts';
import { describe, expect, it } from 'vitest';

import { renderCompactYAxisTick } from '@/components/charts/chart-ticks';

function renderTick(value: number) {
  const props = {
    x: 10,
    y: 20,
    textAnchor: 'end',
    payload: { value },
  } as unknown as YAxisTickContentProps;
  const { container } = render(<svg>{renderCompactYAxisTick(props)}</svg>);
  return container.querySelector('text')!;
}

describe('renderCompactYAxisTick', () => {
  it('renders the compact value at the tick position', () => {
    const text = renderTick(1500);

    expect(text).toHaveAttribute('x', '10');
    expect(text).toHaveAttribute('y', '20');
    expect(text).toHaveAttribute('font-weight', '400');
    expect(text.textContent).not.toBe('');
  });

  it('emphasizes the zero tick', () => {
    expect(renderTick(0)).toHaveAttribute('font-weight', '700');
  });
});
