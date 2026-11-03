import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountStatusSection } from '@/components/dashboard/sections/account-status-section';

const mockLoadAccountUser = vi.fn();

vi.mock('@/app/dashboard/dashboard-loaders', () => ({
  loadAccountUser: () => mockLoadAccountUser(),
}));
vi.mock('@/components/account/user-status-section', () => ({
  UserStatusSection: ({ email }: { email: string }) => <div>{email}</div>,
}));

describe('AccountStatusSection', () => {
  it('renders the account status for any user status', async () => {
    mockLoadAccountUser.mockResolvedValue({
      name: null,
      email: 'jan@example.com',
      status: 'PENDING',
    });

    render(await AccountStatusSection());

    expect(screen.getByText('jan@example.com')).toBeInTheDocument();
  });

  it('renders nothing for a missing user', async () => {
    mockLoadAccountUser.mockResolvedValue(null);

    expect(await AccountStatusSection()).toBeNull();
  });
});
