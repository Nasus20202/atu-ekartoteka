import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MultiChargesDisplay } from '@/components/charges/multi-charges-display';

vi.mock('@/components/charges/multi-apartment-period-card', () => ({
  MultiApartmentPeriodCard: ({ totalAmount }: { totalAmount: unknown }) => (
    <div data-testid="period-card">{String(totalAmount)}</div>
  ),
}));

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? <div>{children}</div> : <div>{children}</div>),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function makeCharge(totalAmount: number) {
  return {
    id: `charge-${totalAmount}`,
    description: 'Test charge',
    quantity: '1',
    unit: 'szt',
    unitPrice: String(totalAmount),
    totalAmount: String(totalAmount),
    dateFrom: '2025-01-01T00:00:00.000Z',
    dateTo: '2025-01-31T00:00:00.000Z',
  };
}

function makeApartmentData(totalAmount: number) {
  return {
    apartmentNumber: '101',
    apartmentAddress: 'ul. Testowa 1 A/101',
    hoaName: 'Wspólnota Testowa',
    charges: [makeCharge(totalAmount)],
  };
}

describe('MultiChargesDisplay', () => {
  describe('groupByYear', () => {
    it('renders a section for each unique year in descending order', () => {
      const periods = ['2025-01', '2025-02', '2024-12'];
      const chargesByPeriod = {
        '2025-01': [makeApartmentData(100)],
        '2025-02': [makeApartmentData(200)],
        '2024-12': [makeApartmentData(50)],
      };

      render(
        <MultiChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Year trigger buttons: 2025, 2024 should appear (descending)
      const yearButtons = buttons.filter((b) =>
        ['2025', '2024'].some((y) => b.textContent?.includes(y))
      );
      expect(yearButtons.length).toBeGreaterThanOrEqual(2);
      const firstYearText = yearButtons[0].textContent;
      expect(firstYearText).toContain('2025');
    });

    it('groups periods from the same year together', () => {
      const periods = ['2025-01', '2025-03', '2024-06'];
      const chargesByPeriod = {
        '2025-01': [makeApartmentData(10)],
        '2025-03': [makeApartmentData(20)],
        '2024-06': [makeApartmentData(30)],
      };

      render(
        <MultiChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
        />
      );

      // 2 year groups rendered
      const allButtons = screen.getAllByRole('button');
      const yearButtons = allButtons.filter(
        (b) => b.textContent === '2025' || b.textContent === '2024'
      );
      expect(yearButtons).toHaveLength(2);
    });

    it('renders nothing when periods is empty', () => {
      const { container } = render(
        <MultiChargesDisplay periods={[]} chargesByPeriod={{}} />
      );
      expect(container.firstChild).toBeEmptyDOMElement();
    });
  });

  describe('computePeriodTotal', () => {
    it('sums totalAmount across all apartments and charges in a period', () => {
      const periods = ['2025-01'];
      const chargesByPeriod = {
        '2025-01': [
          {
            apartmentNumber: '101',
            apartmentAddress: 'ul. A 1/101',
            hoaName: 'Wspólnota Testowa',
            charges: [makeCharge(100), makeCharge(50)],
          },
          {
            apartmentNumber: '102',
            apartmentAddress: 'ul. A 1/102',
            hoaName: 'Wspólnota Testowa',
            charges: [makeCharge(200)],
          },
        ],
      };

      render(
        <MultiChargesDisplay
          periods={periods}
          chargesByPeriod={chargesByPeriod}
        />
      );

      // The period card receives the total: 100 + 50 + 200 = 350
      const card = screen.getByTestId('period-card');
      expect(card.textContent).toBe('350');
    });

    it('returns 0 for a period with no data', () => {
      const periods = ['2025-01'];

      render(<MultiChargesDisplay periods={periods} chargesByPeriod={{}} />);

      const card = screen.getByTestId('period-card');
      expect(card.textContent).toBe('0');
    });
  });
});
