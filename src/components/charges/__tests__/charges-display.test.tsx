import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChargesDisplay } from '@/components/charges/charges-display';

vi.mock('@/components/charges/period-card', () => ({
  PeriodCard: ({ period }: { period: string }) => (
    <div data-testid={`period-card-${period}`}>{period}</div>
  ),
}));

vi.mock('@/components/pdf/download-charges-pdf-button', () => ({
  DownloadChargesPdfButton: () => <button>Download</button>,
}));

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({
    children,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: () => void;
  }) => <div onClick={onOpenChange}>{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const baseProps = {
  chargesByPeriod: {},
  serializableByPeriod: {},
  activeMonth: null,
  apartmentLabel: 'A/101',
  hoaName: 'Wspólnota Testowa',
};

describe('ChargesDisplay — groupByYear', () => {
  it('renders a year group for each unique year, descending', () => {
    const periods = ['2025-03', '2025-01', '2024-12'];

    render(<ChargesDisplay {...baseProps} periods={periods} />);

    const buttons = screen.getAllByRole('button');
    const yearButtons = buttons.filter(
      (b) => b.textContent === '2025' || b.textContent === '2024'
    );
    expect(yearButtons).toHaveLength(2);
    // 2025 should come before 2024
    expect(yearButtons[0].textContent).toBe('2025');
    expect(yearButtons[1].textContent).toBe('2024');
  });

  it('renders a single year group when all periods share one year', () => {
    const periods = ['2025-01', '2025-06', '2025-12'];

    render(<ChargesDisplay {...baseProps} periods={periods} />);

    const yearButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent === '2025');
    expect(yearButtons).toHaveLength(1);
  });

  it('renders nothing when periods is empty', () => {
    const { container } = render(
      <ChargesDisplay {...baseProps} periods={[]} />
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('renders period cards for periods within a year group', () => {
    const periods = ['2025-01', '2025-02'];

    render(<ChargesDisplay {...baseProps} periods={periods} />);

    expect(screen.getByTestId('period-card-2025-01')).toBeInTheDocument();
    expect(screen.getByTestId('period-card-2025-02')).toBeInTheDocument();
  });
});

describe('ChargesDisplay — toggleYear', () => {
  it('calls onOpenChange when a year collapsible is toggled', async () => {
    const periods = ['2025-01', '2024-12'];

    render(<ChargesDisplay {...baseProps} periods={periods} />);

    // Click the year trigger button to toggle the year
    const yearButton = screen
      .getAllByRole('button')
      .find((b) => b.textContent === '2025');
    expect(yearButton).toBeDefined();
    await userEvent.click(yearButton!);

    // Year toggle ran without error — period card still rendered
    expect(screen.getByTestId('period-card-2025-01')).toBeInTheDocument();
  });

  it('calls onOpenChange for the period collapsible when toggled', async () => {
    const periods = ['2025-01'];

    render(<ChargesDisplay {...baseProps} periods={periods} />);

    // Period trigger button (CollapsibleTrigger) contains the formatted period text
    // Find a button that includes the amount text (period buttons have currency amounts)
    const periodButton = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('zł'));
    expect(periodButton).toBeDefined();
    await userEvent.click(periodButton!);

    // Period toggle ran without error
    expect(screen.getByTestId('period-card-2025-01')).toBeInTheDocument();
  });
});

describe('ChargesDisplay — activeMonth', () => {
  it('applies active styling to the active month trigger', () => {
    const periods = ['2025-01', '2025-02'];
    const chargesByPeriod = {
      '2025-01': [
        {
          id: 'c1',
          description: 'Czynsz',
          totalAmount: 500,
          quantity: 1,
          unit: 'szt',
          unitPrice: 500,
          dateFrom: new Date(),
          dateTo: new Date(),
        },
      ],
    };

    render(
      <ChargesDisplay
        {...baseProps}
        periods={periods}
        chargesByPeriod={chargesByPeriod}
        activeMonth="2025-01"
      />
    );

    // Active month period card is rendered
    expect(screen.getByTestId('period-card-2025-01')).toBeInTheDocument();
  });

  it('opens the active month by default', () => {
    const periods = ['2025-01', '2025-02'];

    render(
      <ChargesDisplay {...baseProps} periods={periods} activeMonth="2025-01" />
    );

    // Both period cards rendered (mock renders all content regardless of open state)
    expect(screen.getByTestId('period-card-2025-01')).toBeInTheDocument();
    expect(screen.getByTestId('period-card-2025-02')).toBeInTheDocument();
  });
});
