import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChargeTrendChart } from '@/components/charts/charge-trend-chart';
import { getChargesHref } from '@/lib/utils/dashboard-links';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/components/charts/measured-chart', () => ({
  MeasuredChart: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => ReactNode;
  }) => <div>{children({ width: 400, height: 200 })}</div>,
}));

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  AreaChart: ({
    onClick,
    data,
  }: {
    onClick: (state: { activeIndex?: string }) => void;
    data: unknown[];
  }) => (
    <div>
      <span>{data.length} points</span>
      <button onClick={() => onClick({ activeIndex: '1' })}>click month</button>
      <button onClick={() => onClick({ activeIndex: '99' })}>
        click empty
      </button>
      <button onClick={() => onClick({})}>click outside</button>
    </div>
  ),
}));

const data = [
  { period: '202501', label: 'Styczeń 2025', apt_1: 10, apt_2: 5 },
  { period: '202502', label: 'Luty 2025', apt_1: 20, apt_2: 6 },
];

const series = (count: number) =>
  [
    { key: 'apt_1', label: 'A', color: 'red', apartmentId: 'apt-1' },
    { key: 'apt_2', label: 'B', color: 'blue', apartmentId: 'apt-2' },
  ].slice(0, count);

describe('ChargeTrendChart navigation', () => {
  beforeEach(() => push.mockClear());

  it('opens the charges of the clicked month for a single apartment', () => {
    render(<ChargeTrendChart data={data} series={series(1)} />);

    fireEvent.click(screen.getByText('click month'));

    expect(push).toHaveBeenCalledWith(
      getChargesHref({ apartmentId: 'apt-1', period: '202502' })
    );
  });

  it('opens the charges of all apartments when several are shown', () => {
    render(<ChargeTrendChart data={data} series={series(2)} />);

    fireEvent.click(screen.getByText('click month'));

    expect(push).toHaveBeenCalledWith(
      getChargesHref({ apartmentId: undefined, period: '202502' })
    );
  });

  it('ignores clicks that do not hit a month', () => {
    render(<ChargeTrendChart data={data} series={series(1)} />);

    fireEvent.click(screen.getByText('click empty'));
    fireEvent.click(screen.getByText('click outside'));

    expect(push).not.toHaveBeenCalled();
  });
});
