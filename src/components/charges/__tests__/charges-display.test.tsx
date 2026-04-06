import { render, screen } from '@testing-library/react';
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
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
