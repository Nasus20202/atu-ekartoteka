import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DatabaseStatsCard } from '@/app/admin/import/database-stats-card';

describe('DatabaseStatsCard', () => {
  it('renders loading state', () => {
    render(<DatabaseStatsCard dbStats={null} statsLoading />);

    expect(screen.getByText(/ładowanie/i)).toBeInTheDocument();
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
        }}
      />
    );

    expect(screen.getByText(/stan bazy danych/i)).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('renders error state when stats are unavailable', () => {
    render(<DatabaseStatsCard dbStats={null} statsLoading={false} />);

    expect(
      screen.getByText(/nie udało się pobrać statystyk/i)
    ).toBeInTheDocument();
  });
});
