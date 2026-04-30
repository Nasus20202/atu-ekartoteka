import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from '@/app/register/page';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/layout/auth-layout', () => ({
  AuthLayout: ({
    children,
    title,
    description,
  }: {
    children: React.ReactNode;
    title?: string;
    description?: string;
  }) => (
    <div>
      {title && <h1>{title}</h1>}
      {description && <p>{description}</p>}
      {children}
    </div>
  ),
}));

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({
    onSuccess,
    onExpire,
    onError,
  }: {
    onSuccess: (token: string) => void;
    onExpire: () => void;
    onError: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSuccess('turnstile-token')}>
        turnstile-success
      </button>
      <button type="button" onClick={onExpire}>
        turnstile-expire
      </button>
      <button type="button" onClick={onError}>
        turnstile-error
      </button>
    </div>
  ),
}));

global.fetch = vi.fn();

describe('RegisterPage', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
          json: async () => ({ message: 'ok', autoLoginToken: 'token-123' }),
        } as Response);
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
        autoLoginBypassToken: 'token-123',
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

  it('shows validation error when passwords do not match', async () => {
    render(<RegisterPage />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'different123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    expect(screen.getByText('Hasła nie są identyczne')).toBeInTheDocument();
  });

  it('shows validation error when password is too short', async () => {
    render(<RegisterPage />);

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'short' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    expect(
      screen.getAllByText('Hasło musi mieć co najmniej 8 znaków').length
    ).toBeGreaterThan(1);
  });

  it('renders initial admin mode when setup is required', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/setup/check')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ needsSetup: true }),
        } as Response);
      }

      if (String(url).includes('/api/config/turnstile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ enabled: false, siteKey: null }),
        } as Response);
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<RegisterPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Konfiguracja początkowa' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Utwórz konto administratora' })
      ).toBeInTheDocument();
    });
  });

  it('requires turnstile token when enabled before allowing submit', async () => {
    const user = userEvent.setup();
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
          json: async () => ({ enabled: true, siteKey: 'site-key' }),
        } as Response);
      }

      if (String(url).includes('/api/register')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'ok', autoLoginToken: 'token-123' }),
        } as Response);
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });
    vi.mocked(signIn).mockResolvedValue({ error: undefined } as never);

    render(<RegisterPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Zarejestruj się' })
      ).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Potwierdź hasło'), {
      target: { value: 'password123' },
    });

    await user.click(screen.getByRole('button', { name: 'turnstile-success' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Zarejestruj się' })
      ).not.toBeDisabled();
    });
  });

  it('falls back when setup check fails', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/setup/check')) {
        return Promise.reject(new Error('setup failed'));
      }

      if (String(url).includes('/api/config/turnstile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ enabled: false, siteKey: null }),
        } as Response);
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<RegisterPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Rejestracja' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Zarejestruj się' })
      ).toBeInTheDocument();
    });
  });

  it('falls back when turnstile config fails', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/setup/check')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ needsSetup: false }),
        } as Response);
      }

      if (String(url).includes('/api/config/turnstile')) {
        return Promise.reject(new Error('turnstile failed'));
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<RegisterPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Zarejestruj się' })
      ).not.toBeDisabled();
    });
  });

  it('shows registration api error', async () => {
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
          ok: false,
          json: async () => ({ error: 'Email już istnieje' }),
        } as Response);
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });

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
      expect(screen.getByText('Email już istnieje')).toBeInTheDocument();
    });
  });
});
