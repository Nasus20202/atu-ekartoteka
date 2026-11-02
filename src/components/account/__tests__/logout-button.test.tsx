import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LogoutButton } from '@/components/account/logout-button';

const mockLogout = vi.fn();
let mockPending = false;

vi.mock('@/components/account/use-logout', () => ({
  useLogout: () => ({ logout: mockLogout, pending: mockPending }),
}));

describe('LogoutButton', () => {
  it('renders logout button', () => {
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /wyloguj/i });
    expect(button).toBeInTheDocument();
  });

  it('logs out when clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: /wyloguj/i }));

    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('is disabled while logging out', () => {
    mockPending = true;
    render(<LogoutButton />);

    expect(screen.getByRole('button', { name: /wyloguj/i })).toBeDisabled();
    mockPending = false;
  });

  it('has LogOut icon', () => {
    const { container } = render(<LogoutButton />);

    const icon = container.querySelector('svg.lucide-log-out');
    expect(icon).toBeInTheDocument();
  });
});
