import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';

const forgotPasswordActionMock = vi.hoisted(() => vi.fn());
const resetMock = vi.fn();

vi.mock('@/actions/auth/forgot-password', () => ({
  forgotPasswordAction: forgotPasswordActionMock,
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
    token: 'turnstile-token',
    reset: resetMock,
    isPending: false,
  }),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forgotPasswordActionMock.mockResolvedValue({ ok: true, data: undefined });
  });

  it('shows the instructional email placeholder', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'placeholder',
      'Wprowadź adres e-mail'
    );
  });

  it('sends the request and shows the confirmation', async () => {
    render(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij link resetowania' })
    );

    await waitFor(() => {
      expect(forgotPasswordActionMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        turnstileToken: 'turnstile-token',
      });
    });
    expect(resetMock).toHaveBeenCalled();
    expect(
      await screen.findByRole('heading', {
        name: 'Sprawdź swoją skrzynkę email',
      })
    ).toBeInTheDocument();
  });

  it('shows the failure in an animated alert', async () => {
    forgotPasswordActionMock.mockResolvedValue({
      ok: false,
      code: 'failed',
      error: 'Nie udało się przetworzyć żądania',
    });
    render(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij link resetowania' })
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Nie udało się przetworzyć żądania');
    expect(alert).toHaveAttribute('data-state', 'open');
  });
});
