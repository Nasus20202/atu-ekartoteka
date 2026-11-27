import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { utilityDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { MetersView } from '@/components/settlements/meters-view';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

vi.mock('@/components/settlements/use-settlement-params', () => ({
  useSettlementParams: () => ({ update: vi.fn() }),
}));

const HINT = 'Kolejne okresy pojawią się tutaj po następnych odczytach.';
const settlement = utilityDto();
const [meter] = settlement.utilities[0].meters;
const table = {
  readingMeters: [{ device: meter.device, label: meter.label }],
  readingsQuery: ALL_READINGS,
};

describe('MetersView', () => {
  it('shows each meter of the period with its latest state', () => {
    render(
      <MetersView
        {...table}
        settlement={settlement}
        readings={[meter]}
        singlePeriod
      />
    );
    const card = screen.getByRole('region', {
      name: 'Ciepła woda (CW), licznik 7000001',
    });

    expect(card).toHaveTextContent('Licznik nr 7000001');
    expect(card).toHaveTextContent('115,800 m³');
    expect(card).toHaveTextContent('stan na 30.09.2022');
    expect(card).toHaveTextContent('Zużycie w okresie: 10,300 m³');
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  it('lists the readings of every period with device and label', () => {
    const readings = [
      meter,
      { ...meter, id: 'older', endDate: '2022-04-30' },
      { ...meter, id: 'oldest', endDate: '2021-09-30' },
    ];

    render(
      <MetersView
        {...table}
        settlement={settlement}
        readings={readings}
        singlePeriod={false}
      />
    );

    const list = screen.getByRole('table', { name: 'Odczyty' });
    const rows = within(list).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(meter.label);
    expect(rows[0]).toHaveTextContent(meter.device);
    expect(rows[2]).toHaveTextContent('30.09.2021');
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it('heads a meter without a utility with its printed label', () => {
    const other = utilityDto({
      meters: [
        'XY 01 9000009 (XY 1) 30/04/2022 1,000 30/09/2022 2,000 1,000 m3',
      ],
    });

    render(
      <MetersView
        settlement={other}
        readings={[]}
        readingMeters={[]}
        readingsQuery={ALL_READINGS}
        singlePeriod
      />
    );

    expect(
      screen.getByRole('heading', { name: other.otherMeters[0].label })
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('says when the period has no meters', () => {
    render(
      <MetersView
        settlement={utilityDto({ meters: [] })}
        readings={[]}
        readingMeters={[]}
        readingsQuery={ALL_READINGS}
        singlePeriod={false}
      />
    );

    expect(
      screen.getByText('Brak odczytów liczników w tym okresie.')
    ).toBeInTheDocument();
  });
});
