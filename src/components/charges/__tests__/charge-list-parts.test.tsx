import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ChargeRows,
  PeriodRange,
} from '@/components/charges/charge-list-parts';
import type { ChargeDisplayDto } from '@/lib/types/dto/charge-dto';
import { formatCurrency } from '@/lib/utils';

function makeCharge(
  id: string,
  dateFrom: string,
  dateTo: string
): ChargeDisplayDto {
  return {
    id,
    description: `Opłata ${id}`,
    quantity: '2',
    unit: 'szt',
    unitPrice: '10',
    totalAmount: '20',
    dateFrom,
    dateTo,
  };
}

describe('PeriodRange', () => {
  it('shows the earliest start and latest end of the charges', () => {
    render(
      <PeriodRange
        charges={[
          makeCharge(
            'a',
            '2025-11-05T00:00:00.000Z',
            '2025-11-20T00:00:00.000Z'
          ),
          makeCharge(
            'b',
            '2025-11-01T00:00:00.000Z',
            '2025-11-30T00:00:00.000Z'
          ),
        ]}
      />
    );

    expect(
      screen.getByText('Okres 01.11.2025 – 30.11.2025')
    ).toBeInTheDocument();
  });

  it('renders nothing without charges', () => {
    const { container } = render(<PeriodRange charges={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ChargeRows', () => {
  it('shows description, quantity breakdown and amount of each charge', () => {
    render(
      <ChargeRows
        charges={[
          makeCharge(
            'a',
            '2025-11-01T00:00:00.000Z',
            '2025-11-30T00:00:00.000Z'
          ),
        ]}
      />
    );

    expect(screen.getByText('Opłata a')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent === `2 szt × ${formatCurrency(10)}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element.textContent === formatCurrency(20)
      )
    ).toBeInTheDocument();
  });
});
