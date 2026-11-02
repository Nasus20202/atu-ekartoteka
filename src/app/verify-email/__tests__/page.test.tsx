import { render, screen } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VerifyEmailPage from '@/app/verify-email/page';

const mockPush = vi.fn();
const mockGet = vi.fn((_key: string): string | null => 'verify-token');
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

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue('verify-token');
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as never);
  });

  it('confirms the verification after the token is accepted', async () => {
    render(<VerifyEmailPage />);

    expect(
      await screen.findByRole('heading', { name: 'Email zweryfikowany!' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Przekierowywanie do pulpitu...')
    ).toBeInTheDocument();
  });

  it('reports a missing token', () => {
    mockGet.mockReturnValue(null);

    render(<VerifyEmailPage />);

    expect(
      screen.getByRole('heading', { name: 'Błąd weryfikacji' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Brak tokenu weryfikacyjnego w linku')
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows the API error message when the token is rejected', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Token wygasł' }),
    });

    render(<VerifyEmailPage />);

    expect(await screen.findByText('Token wygasł')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Błąd weryfikacji' })
    ).toBeInTheDocument();
  });
});
