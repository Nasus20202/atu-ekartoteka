import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UsersPagination } from '@/app/admin/users/users-pagination';

describe('UsersPagination', () => {
  it('renders nothing for one page', () => {
    const { container } = render(
      <UsersPagination
        page={1}
        totalPages={1}
        disabled={false}
        onPageChange={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('moves between pages within bounds', async () => {
    const onPageChange = vi.fn();
    render(
      <UsersPagination
        page={2}
        totalPages={3}
        disabled={false}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('Strona 2 z 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Poprzednia' }));
    await userEvent.click(screen.getByRole('button', { name: 'Następna' }));
    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
  });

  it('disables both buttons while loading', () => {
    render(
      <UsersPagination
        page={2}
        totalPages={3}
        disabled
        onPageChange={vi.fn()}
      />
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});
