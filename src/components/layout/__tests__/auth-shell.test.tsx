import { act, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import packageJson from '@/../package.json';
import { startAuthExit } from '@/components/layout/auth-exit';
import { AuthShell } from '@/components/layout/auth-shell';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/login') }));

vi.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <button>Motyw</button>,
}));

describe('AuthShell', () => {
  it('renders the content, version and theme toggle', () => {
    render(
      <AuthShell>
        <p>Formularz</p>
      </AuthShell>
    );

    expect(screen.getByText('Formularz')).toBeInTheDocument();
    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Motyw' })).toBeInTheDocument();
  });

  it('renders a decorative skyline behind the content', () => {
    render(<AuthShell>treść</AuthShell>);

    expect(screen.getByTestId('auth-skyline')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('lowers the skyline when the user signs in and raises it on the next page', () => {
    const { rerender } = render(<AuthShell>treść</AuthShell>);
    const skyline = screen.getByTestId('auth-skyline');
    expect(skyline).not.toHaveClass('translate-y-full');

    act(() => startAuthExit());
    expect(skyline).toHaveClass('translate-y-full');

    vi.mocked(usePathname).mockReturnValue('/change-password');
    rerender(<AuthShell>treść</AuthShell>);
    expect(skyline).not.toHaveClass('translate-y-full');
  });

  it('keeps the same skyline element while the page content changes', () => {
    const { rerender } = render(<AuthShell>pierwsza</AuthShell>);
    const skyline = screen.getByTestId('auth-skyline');

    rerender(<AuthShell>druga</AuthShell>);

    expect(screen.getByTestId('auth-skyline')).toBe(skyline);
  });
});
