import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BalanceHistoryChart } from '@/components/charts/balance-history-chart';
import { getPaymentYearHref } from '@/lib/utils/dashboard-links';

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
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: ({
    name,
    onClick,
  }: {
    name: string;
    onClick: (bar: { payload?: { period?: string } }) => void;
  }) => (
    <div>
      <button onClick={() => onClick({ payload: { period: '202403' } })}>
        {name} bar
      </button>
      <button onClick={() => onClick({})}>{name} empty</button>
    </div>
  ),
}));

const data = [
  { period: '202402', label: 'Luty', apt_1: 10, apt_2: -5 },
  { period: '202403', label: 'Marzec', apt_1: -20, apt_2: 6 },
];

const series = [
  { key: 'apt_1', label: 'A', color: 'red', apartmentId: 'apt-1' },
  { key: 'apt_2', label: 'B', color: 'blue', apartmentId: 'apt-2' },
] as const;

describe('BalanceHistoryChart navigation', () => {
  beforeEach(() => push.mockClear());

  it('opens the payment year of a single apartment from its bar', () => {
    render(<BalanceHistoryChart data={data} series={[series[0]]} />);

    fireEvent.click(screen.getByText('A bar'));

    expect(push).toHaveBeenCalledWith(getPaymentYearHref('apt-1', 2024));
  });

  it('opens the payment year of the clicked apartment among several', () => {
    render(<BalanceHistoryChart data={data} series={[...series]} />);

    fireEvent.click(screen.getByText('B bar'));

    expect(push).toHaveBeenCalledWith(getPaymentYearHref('apt-2', 2024));
  });

  it('ignores clicks on bars without a period', () => {
    render(<BalanceHistoryChart data={data} series={[...series]} />);

    fireEvent.click(screen.getByText('A empty'));

    expect(push).not.toHaveBeenCalled();
  });
});
