import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordPage from '@/app/reset-password/page';

const mockPush = vi.fn();
const mockGet = vi.fn((_key: string): string | null => 'reset-token');
const mockReset = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/components/layout/auth-layout', () => ({
  AuthLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

vi.mock('@/components/auth/turnstile-field', () => ({
  TurnstileField: () => null,
}));

vi.mock('@/hooks/use-turnstile', () => ({
  useTurnstile: () => ({
    token: null,
    reset: mockReset,
    isPending: false,
  }),
}));

async function submitPasswords(password: string, confirmPassword: string) {
  const user = userEvent.setup();
  render(<ResetPasswordPage />);

  await user.type(screen.getByLabelText('Nowe hasło'), password);
  await user.type(screen.getByLabelText('Potwierdź hasło'), confirmPassword);
  await user.click(screen.getByRole('button', { name: 'Zresetuj hasło' }));
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue('reset-token');
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as never);
  });

  it('asks for a new link when the token is missing', () => {
    mockGet.mockReturnValue(null);

    render(<ResetPasswordPage />);

    expect(
      screen.getByRole('heading', { name: 'Nieprawidłowy link' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Wyślij nowy link resetowania' })
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('confirms the change after a successful reset', async () => {
    await submitPasswords('secret123', 'secret123');

    expect(
      await screen.findByRole('heading', { name: 'Hasło zostało zmienione' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Przekierowywanie do strony logowania...')
    ).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/reset-password',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows a mismatch error without calling the API', async () => {
    await submitPasswords('secret123', 'secret124');

    await waitFor(() => {
      expect(screen.getByText('Hasła nie są identyczne')).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows the API error message when the reset is rejected', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Link wygasł' }),
    });

    await submitPasswords('secret123', 'secret123');

    await waitFor(() => {
      expect(screen.getByText('Link wygasł')).toBeInTheDocument();
    });
  });
});
