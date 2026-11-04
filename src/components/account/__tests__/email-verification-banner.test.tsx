import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailVerificationBanner } from '@/components/account/email-verification-banner';

const mocks = vi.hoisted(() => ({ resend: vi.fn() }));

vi.mock('@/actions/account/verification', () => ({
  resendVerificationAction: mocks.resend,
}));

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    mocks.resend.mockReset();
  });

  it('renders nothing for a verified email', () => {
    const { container } = render(<EmailVerificationBanner emailVerified />);

    expect(container).toBeEmptyDOMElement();
  });

  it('can be dismissed', async () => {
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Zamknij' }));

    expect(
      screen.queryByText('Twój adres email wymaga weryfikacji')
    ).not.toBeInTheDocument();
  });

  it('resends the verification email', async () => {
    mocks.resend.mockResolvedValue({ ok: true, data: { message: '' } });
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(mocks.resend).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('Email weryfikacyjny został wysłany')
    ).toBeInTheDocument();
  });

  it('shows the API error message', async () => {
    mocks.resend.mockResolvedValue({
      ok: false,
      error: 'Poczekaj 4 min przed ponownym wysłaniem',
      code: 'failed',
    });
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(
      await screen.findByText('Poczekaj 4 min przed ponownym wysłaniem')
    ).toBeInTheDocument();
  });

  it('shows a generic message for non-Error failures', async () => {
    mocks.resend.mockRejectedValue('offline');
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(await screen.findByText('Wystąpił błąd')).toBeInTheDocument();
  });

  it('disables the button while sending', async () => {
    mocks.resend.mockReturnValue(new Promise(() => {}));
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(screen.getByRole('button', { name: 'Wysyłanie...' })).toBeDisabled();
  });
});
