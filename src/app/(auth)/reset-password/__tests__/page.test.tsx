import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordPage from '@/app/(auth)/reset-password/page';

const mockPush = vi.fn();
const mockGet = vi.fn((): string | null => 'reset-token');
const mockReset = vi.fn();
const resetPasswordActionMock = vi.hoisted(() => vi.fn());

vi.mock('@/actions/auth/reset-password', () => ({
  resetPasswordAction: resetPasswordActionMock,
}));

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
    resetPasswordActionMock.mockResolvedValue({ ok: true, data: undefined });
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

  it('shows the instructional placeholders and toggles each password independently', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    const password = screen.getByLabelText('Nowe hasło');
    const confirmPassword = screen.getByLabelText('Potwierdź hasło');
    expect(password).toHaveAttribute('placeholder', 'Wprowadź nowe hasło');
    expect(confirmPassword).toHaveAttribute(
      'placeholder',
      'Powtórz nowe hasło'
    );

    const toggles = screen.getAllByRole('button', { name: 'Pokaż hasło' });
    expect(toggles).toHaveLength(2);

    await user.click(toggles[0]);
    expect(password).toHaveAttribute('type', 'text');
    expect(confirmPassword).toHaveAttribute('type', 'password');
  });

  it('confirms the change after a successful reset', async () => {
    await submitPasswords('secret123', 'secret123');

    expect(
      await screen.findByRole('heading', { name: 'Hasło zostało zmienione' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Przekierowywanie do strony logowania...')
    ).toBeInTheDocument();
    expect(resetPasswordActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'reset-token', password: 'secret123' })
    );
  });

  it('shows a mismatch error without calling the API', async () => {
    await submitPasswords('secret123', 'secret124');

    await waitFor(() => {
      expect(screen.getByText('Hasła nie są identyczne')).toBeInTheDocument();
    });
    expect(resetPasswordActionMock).not.toHaveBeenCalled();
  });

  it('shows the API error message when the reset is rejected', async () => {
    resetPasswordActionMock.mockResolvedValue({
      ok: false,
      code: 'invalid',
      error: 'Link wygasł',
    });

    await submitPasswords('secret123', 'secret123');

    await waitFor(() => {
      expect(screen.getByText('Link wygasł')).toBeInTheDocument();
    });
  });
});
