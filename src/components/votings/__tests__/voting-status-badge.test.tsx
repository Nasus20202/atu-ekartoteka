import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VotingStatusBadge } from '@/components/votings/voting-status-badge';

describe('VotingStatusBadge', () => {
  it.each([
    ['DRAFT', 'Wersja robocza'],
    ['ACTIVE', 'Aktywne'],
    ['RESULTS_PUBLISHED', 'Pokaż wyniki'],
    ['ARCHIVED', 'Zarchiwizowane'],
  ] as const)('labels %s in Polish', (status, label) => {
    render(<VotingStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
