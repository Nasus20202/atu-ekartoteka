import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChargesSummaryCard } from '@/components/dashboard/charges-summary-card';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('ChargesSummaryCard history window', () => {
  it('shows no previous month when it has no visible charges', () => {
    render(
      <ChargesSummaryCard
        currentPeriod="202701"
        previousPeriod="202612"
        currentMonthCount={1}
        previousMonthCount={0}
        currentMonthTotal={600}
        previousMonthTotal={0}
      />
    );

    expect(screen.queryByText('Grudzień 2026')).not.toBeInTheDocument();
    expect(screen.queryByText('0,00 zł')).not.toBeInTheDocument();
    expect(screen.getByText('600,00 zł')).toBeInTheDocument();
  });
});
