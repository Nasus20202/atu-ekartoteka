import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from '@/app/register/page';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/auth-layout', () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

global.fetch = vi.fn();

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      refresh: refreshMock,
    } as unknown as ReturnType<typeof useRouter>);

    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/setup/check')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ needsSetup: false }),
        } as Response);
      }

      if (String(url).includes('/api/config/turnstile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ enabled: false, siteKey: null }),
        } as Response);
      }

      if (String(url).includes('/api/register')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'ok' }),
        } as Response);
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('logs in automatically after successful registration', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: undefined } as never);

    render(<RegisterPage />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'new@example.com',
        password: 'password123',
        turnstileToken: null,
        redirect: false,
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it('shows a manual-login error when auto-login fails', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
    } as never);

    render(<RegisterPage />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Konto utworzone, ale nie udało się zalogować automatycznie. Zaloguj się ręcznie.'
        )
      ).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
