import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminVotingsSkeleton } from '@/components/votings/admin-votings-skeleton';
import { ListViewMode } from '@/lib/shared/list-view-mode';

describe('AdminVotingsSkeleton', () => {
  it('takes the shape of the chosen view', () => {
    const { unmount } = render(
      <AdminVotingsSkeleton mode={ListViewMode.TABLE} />
    );
    expect(screen.getByTestId('votings-table-skeleton')).toBeInTheDocument();
    unmount();

    render(<AdminVotingsSkeleton mode={ListViewMode.CARDS} />);
    expect(screen.getByTestId('card-list-skeleton')).toBeInTheDocument();
  });
});
