import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/login/page';
import { startAuthExit } from '@/components/layout/auth-exit';

vi.mock('@/components/layout/auth-exit', () => ({ startAuthExit: vi.fn() }));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockGet = vi.fn((_key: string): string | null => null);

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/components/layout/auth-layout', () => ({
  AuthLayout: ({
    children,
  }: {
    children: React.ReactNode;
    title?: string;
    description?: string;
  }) => <div>{children}</div>,
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

function mockFetch({
  googleEnabled = false,
  turnstileEnabled = false,
}: {
  googleEnabled?: boolean;
  turnstileEnabled?: boolean;
} = {}) {
  vi.mocked(fetch).mockImplementation((url) => {
    if (String(url).includes('/api/config/google')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ enabled: googleEnabled }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({
        enabled: turnstileEnabled,
        siteKey: turnstileEnabled ? 'site-key' : null,
      }),
    } as Response);
  });
}

function setupMocks() {
  vi.mocked(useSession).mockReturnValue({
    status: 'unauthenticated',
    data: null,
    update: vi.fn(),
  } as ReturnType<typeof useSession>);
  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
  } as never);
  vi.mocked(useSearchParams).mockReturnValue({ get: mockGet } as never);
}

describe('LoginPage — form fields and actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
    setupMocks();
    mockFetch({ googleEnabled: true });
  });

  it('shows instructional placeholders', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'placeholder',
      'Wprowadź adres e-mail'
    );
    expect(screen.getByLabelText('Hasło')).toHaveAttribute(
      'placeholder',
      'Wprowadź hasło'
    );
  });

  it('reveals and hides the password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const password = screen.getByLabelText('Hasło');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ukryj hasło' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('orders submit, Google divider and registration link', async () => {
    render(<LoginPage />);

    const submit = screen.getByRole('button', { name: 'Zaloguj się' });
    const google = await screen.findByRole('button', {
      name: /Zaloguj się przez Google/,
    });
    const divider = screen.getByText('Lub');
    const register = screen.getByRole('link', { name: 'Zarejestruj się' });

    expect(isAfter(divider, submit)).toBe(true);
    expect(isAfter(google, divider)).toBe(true);
    expect(isAfter(register, google)).toBe(true);
  });

  it('reserves the OAuth slot until the config resolves', () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/config/google')) {
        return new Promise(() => {});
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ enabled: false, siteKey: null }),
      } as Response);
    });

    render(<LoginPage />);

    expect(screen.getByTestId('google-slot-skeleton')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Zaloguj się przez Google/ })
    ).not.toBeInTheDocument();
  });

  it('shows a spinner and a loading label while submitting', async () => {
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {}));

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    const button = screen.getByRole('button', { name: /Logowanie/ });
    expect(button).toBeDisabled();
  });
});

function isAfter(node: Node, reference: Node) {
  return Boolean(
    reference.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
  );
}

describe('LoginPage — Google sign-in button visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
    setupMocks();
  });

  it('hides Google button and separator when Google is disabled', async () => {
    mockFetch({ googleEnabled: false });
    render(<LoginPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Zaloguj się przez Google')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Lub')).not.toBeInTheDocument();
    });
  });

  it('shows Google button and separator when Google is enabled', async () => {
    mockFetch({ googleEnabled: true });
    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Zaloguj się przez Google')).toBeInTheDocument();
      expect(screen.getByText('Lub')).toBeInTheDocument();
    });
  });

  it('hides Google button when Google config fetch fails', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/config/google')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ enabled: false, siteKey: null }),
      } as Response);
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Zaloguj się przez Google')
      ).not.toBeInTheDocument();
    });
  });
});

describe('LoginPage — form submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
    setupMocks();
    mockFetch();
  });

  it('redirects to /dashboard on successful login', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: null } as never);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(startAuthExit).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message when credentials are invalid', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'CredentialsSignin',
    } as never);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(
        screen.getByText('Nieprawidłowy email lub hasło')
      ).toBeInTheDocument();
    });
  });

  it('shows password-reset success message when reset=success param is present', async () => {
    mockGet.mockImplementation((key: string) =>
      key === 'reset' ? 'success' : null
    );

    render(<LoginPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Hasło zostało zmienione. Możesz się teraz zalogować.')
      ).toBeInTheDocument();
    });
  });

  it('redirects home when session is already authenticated', async () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'authenticated',
      data: {
        user: { id: 'user-1' },
        expires: '2099-01-01T00:00:00.000Z',
      },
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('requires turnstile token when enabled and submits it after success', async () => {
    mockFetch({ turnstileEnabled: true });
    vi.mocked(signIn).mockResolvedValue({ error: null } as never);

    render(<LoginPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Zaloguj się' })
      ).toBeDisabled();
    });

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'password123');
    await userEvent.click(
      screen.getByRole('button', { name: 'turnstile-success' })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Zaloguj się' })
      ).not.toBeDisabled();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'password123',
        turnstileToken: 'turnstile-token',
        redirect: false,
      });
    });
  });

  it('starts Google sign-in flow when button is clicked', async () => {
    mockFetch({ googleEnabled: true });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Zaloguj się przez Google')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Zaloguj się przez Google'));

    expect(signIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/dashboard',
    });
  });
});
