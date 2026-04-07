import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/login/page';

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

vi.mock('@/components/auth-layout', () => ({
  AuthLayout: ({
    children,
  }: {
    children: React.ReactNode;
    title?: string;
    description?: string;
  }) => <div>{children}</div>,
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
      json: async () => ({ enabled: turnstileEnabled, siteKey: null }),
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
});
