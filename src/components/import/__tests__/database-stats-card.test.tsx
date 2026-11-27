import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DatabaseStatsCard } from '@/components/import/database-stats-card';

describe('DatabaseStatsCard', () => {
  it('renders a skeleton while loading', () => {
    render(<DatabaseStatsCard dbStats={null} statsLoading />);

    expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
  });

  it('renders stats table', () => {
    render(
      <DatabaseStatsCard
        statsLoading={false}
        dbStats={{
          hoa: 1,
          apartments: 2,
          charges: 3,
          notifications: 4,
          payments: 5,
          users: 6,
          utilitySettlements: 7,
          meterReadings: 8,
          annualSettlements: 9,
        }}
      />
    );

    expect(screen.getByText(/stan bazy danych/i)).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Odczyty liczników' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    );
  });

  it('renders error state when stats are unavailable', () => {
    render(<DatabaseStatsCard dbStats={null} statsLoading={false} />);

    expect(
      screen.getByText(/nie udało się pobrać statystyk/i)
    ).toBeInTheDocument();
  });
});
