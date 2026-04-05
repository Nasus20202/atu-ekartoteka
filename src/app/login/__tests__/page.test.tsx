import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/login/page';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
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

describe('LoginPage — Google sign-in button visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({
      status: 'unauthenticated',
      data: null,
      update: vi.fn(),
    } as ReturnType<typeof useSession>);
  });

  it('hides Google button and separator when Google is disabled', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/config/google')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ enabled: false }),
        } as Response);
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
      expect(screen.queryByText('Lub')).not.toBeInTheDocument();
    });
  });

  it('shows Google button and separator when Google is enabled', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/api/config/google')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ enabled: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ enabled: false, siteKey: null }),
      } as Response);
    });

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
