import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VotingSummaryCard } from '@/components/votings/voting-summary-card';

const VOTING = {
  id: 'v1',
  title: 'Remont dachu',
  description: null,
  status: 'ACTIVE' as const,
  endsAt: null,
  hoaId: 'h1',
  hoaName: 'Lipowa',
  questions: [],
};

describe('VotingSummaryCard', () => {
  it('shows only the header when there is nothing else to show', () => {
    render(<VotingSummaryCard voting={VOTING} />);

    expect(
      screen.getByRole('heading', { name: 'Remont dachu' })
    ).toBeInTheDocument();
    expect(screen.getByText('Lipowa')).toBeInTheDocument();
    expect(screen.queryByRole('definition')).not.toBeInTheDocument();
  });

  it('shows the description, stats and actions', () => {
    render(
      <VotingSummaryCard
        voting={{ ...VOTING, description: 'Opis głosowania' }}
        stats={[{ label: 'Frekwencja', value: '50%' }]}
        actions={<button>Akcja</button>}
        deadlinePassed
      />
    );

    expect(screen.getByText('Opis głosowania')).toBeInTheDocument();
    expect(screen.getByText('Frekwencja')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Akcja' })).toBeInTheDocument();
  });

  it('marks a passed deadline', () => {
    render(
      <VotingSummaryCard
        voting={{ ...VOTING, endsAt: '2026-05-01T10:00:00.000Z' }}
        deadlinePassed
      />
    );

    expect(screen.getByText(/Zakończono: 1 maja 2026/)).toBeInTheDocument();
  });
});
