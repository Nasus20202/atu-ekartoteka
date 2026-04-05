import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangePasswordPage from '@/app/change-password/page';

vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: vi.fn(() => false),
}));

vi.mock('@/app/change-password/actions', () => ({
  refreshSessionAndRedirect: vi.fn(),
}));

vi.mock('@/components/auth-layout', () => ({
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

global.fetch = vi.fn();

describe('ChangePasswordPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { refreshSessionAndRedirect } =
      await import('@/app/change-password/actions');
    vi.mocked(refreshSessionAndRedirect).mockResolvedValue(undefined);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  function getNewPasswordInput(container: HTMLElement) {
    return container.querySelector('#newPassword') as HTMLInputElement;
  }

  function getConfirmPasswordInput(container: HTMLElement) {
    return container.querySelector('#confirmPassword') as HTMLInputElement;
  }

  it('should render the form', () => {
    const { container } = render(<ChangePasswordPage />);

    expect(getNewPasswordInput(container)).toBeInTheDocument();
    expect(getConfirmPasswordInput(container)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ustaw hasło/i })
    ).toBeInTheDocument();
  });

  it('should show error when password is too short', async () => {
    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'short' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(screen.getByText(/co najmniej 8 znaków/i)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should show error when passwords do not match', async () => {
    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'Password123' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'Different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(screen.getByText(/hasła nie są identyczne/i)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should call API and refresh session on success', async () => {
    const { refreshSessionAndRedirect } =
      await import('@/app/change-password/actions');
    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'NewPassword1' }),
      });
    });

    await waitFor(() => {
      expect(refreshSessionAndRedirect).toHaveBeenCalled();
    });
  });

  it('should show error message on API failure', async () => {
    const { refreshSessionAndRedirect } =
      await import('@/app/change-password/actions');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Wystąpił błąd serwera' }),
    } as Response);

    const { container } = render(<ChangePasswordPage />);

    fireEvent.change(getNewPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.change(getConfirmPasswordInput(container), {
      target: { value: 'NewPassword1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

    await waitFor(() => {
      expect(screen.getByText(/wystąpił błąd serwera/i)).toBeInTheDocument();
    });
    expect(refreshSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('should not have a skip/cancel option', () => {
    render(<ChangePasswordPage />);

    expect(
      screen.queryByRole('link', { name: /pomiń/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /anuluj/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pomiń/i })
    ).not.toBeInTheDocument();
  });
});
