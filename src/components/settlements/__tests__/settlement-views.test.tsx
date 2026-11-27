import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { settlementsDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import type { SettlementViewKey } from '@/components/settlements/settlement-view-key';
import { SettlementViews } from '@/components/settlements/settlement-views';
import type { ApartmentSettlementsDto } from '@/lib/settlements/dto/settlement-view-dto';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

const select = vi.hoisted(() => vi.fn());

vi.mock('@/components/settlements/use-settlement-params', () => ({
  useSettlementParams: () => ({ select, update: vi.fn() }),
}));

function Harness({ data }: { data: ApartmentSettlementsDto }) {
  const [view, setView] = useState<SettlementViewKey>('media');
  return <SettlementViews data={data} view={view} onViewChange={setView} />;
}

const open = (name: string) =>
  userEvent.click(screen.getByRole('tab', { name }));

const EMPTY: ApartmentSettlementsDto = {
  utilityPeriods: [],
  utility: null,
  readings: [],
  readingMeters: [],
  readingsQuery: ALL_READINGS,
  annualPeriods: [],
  annual: null,
};

describe('SettlementViews', () => {
  beforeEach(() => vi.clearAllMocks());

  it('switches between the three views with an animation', async () => {
    render(<Harness data={settlementsDto()} />);

    expect(screen.getByText('Nadpłata za media')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveClass(
      'motion-safe:animate-view-switch'
    );

    await open('Liczniki');
    expect(screen.getByRole('table', { name: 'Odczyty' })).toBeInTheDocument();

    await open('Koszty rzeczywiste');
    expect(
      screen.getByRole('table', { name: 'Pozycje rozliczenia' })
    ).toBeInTheDocument();
  });

  it('shows a single period as text', async () => {
    render(<Harness data={settlementsDto()} />);

    expect(screen.getByText('01.05 – 30.09.2022')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Okres' })
    ).not.toBeInTheDocument();

    await open('Koszty rzeczywiste');
    expect(screen.getByText('Rok 2025')).toBeInTheDocument();
  });

  it.each([
    ['Media', 'utilityPeriods', 'period', '01.05 – 30.09.2021'],
    ['Koszty rzeczywiste', 'annualPeriods', 'year', 'Rok 2024'],
  ] as const)(
    'selects another period of %s',
    async (tab, list, param, label) => {
      const data = settlementsDto();
      const older =
        list === 'utilityPeriods'
          ? { id: 'old', periodFrom: '2021-05-01', periodTo: '2021-09-30' }
          : { id: 'old', periodFrom: '2024-01-01', periodTo: '2024-12-31' };
      render(<Harness data={{ ...data, [list]: [...data[list], older] }} />);
      await open(tab);

      await userEvent.click(screen.getByRole('button', { name: 'Okres' }));
      await userEvent.click(screen.getByRole('menuitemradio', { name: label }));

      expect(select).toHaveBeenCalledWith(param, 'old');
    }
  );

  it.each([
    ['Media', 'Brak rozliczeń mediów dla tego lokalu.'],
    ['Liczniki', 'Brak odczytów liczników dla tego lokalu.'],
    [
      'Koszty rzeczywiste',
      'Brak rozliczeń kosztów rzeczywistych dla tego lokalu.',
    ],
  ])('says that %s has no settlements', async (tab, message) => {
    render(<Harness data={EMPTY} />);
    await open(tab);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText('Okres')).not.toBeInTheDocument();
  });
});
