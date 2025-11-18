import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LogoutButton } from '@/components/logout-button';

const mockSignOut = vi.fn();

vi.mock('next-auth/react', () => ({
  signOut: () => mockSignOut(),
}));

describe('LogoutButton', () => {
  it('renders logout button', () => {
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /wyloguj/i });
    expect(button).toBeInTheDocument();
  });

  it('calls signOut when clicked', async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /wyloguj/i });
    await user.click(button);

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('has LogOut icon', () => {
    const { container } = render(<LogoutButton />);

    const icon = container.querySelector('svg.lucide-log-out');
    expect(icon).toBeInTheDocument();
  });
});
