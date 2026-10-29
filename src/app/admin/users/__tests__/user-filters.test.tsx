import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UserFilters } from '@/app/admin/users/user-filters';
import { AccountStatus } from '@/lib/types';

describe('UserFilters', () => {
  it('renders selected variant for active filter', () => {
    render(<UserFilters filter="ALL" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: /wszyscy/i })).toHaveClass(
      'bg-primary'
    );
    expect(
      screen.getByRole('button', { name: /administratorzy/i })
    ).toHaveClass('border');
  });

  it('emits all filter values when buttons are clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<UserFilters filter={AccountStatus.PENDING} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /wszyscy/i }));
    await user.click(screen.getByRole('button', { name: /oczekujące/i }));
    await user.click(screen.getByRole('button', { name: /zatwierdzone/i }));
    await user.click(screen.getByRole('button', { name: /odrzucone/i }));
    await user.click(screen.getByRole('button', { name: /administratorzy/i }));

    expect(onChange.mock.calls).toEqual([
      ['ALL'],
      [AccountStatus.PENDING],
      [AccountStatus.APPROVED],
      [AccountStatus.REJECTED],
      ['ADMINS'],
    ]);
  });

  it.each([
    [AccountStatus.APPROVED, /zatwierdzone/i],
    [AccountStatus.REJECTED, /odrzucone/i],
    ['ADMINS' as const, /administratorzy/i],
  ])('highlights the %s filter', (filter, name) => {
    render(<UserFilters filter={filter} onChange={() => {}} />);

    expect(screen.getByRole('button', { name })).toHaveClass('bg-primary');
  });
});
