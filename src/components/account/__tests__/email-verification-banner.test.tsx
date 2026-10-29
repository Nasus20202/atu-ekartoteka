import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailVerificationBanner } from '@/components/account/email-verification-banner';

const mockFetch = vi.fn();

function respond(ok: boolean, body: unknown) {
  mockFetch.mockResolvedValue({ ok, json: () => Promise.resolve(body) });
}

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    respond(true, {});
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(mockFetch).toHaveBeenCalledWith('/api/resend-verification', {
      method: 'POST',
    });
    expect(
      await screen.findByText('Email weryfikacyjny został wysłany')
    ).toBeInTheDocument();
  });

  it('shows the API error message', async () => {
    respond(false, { error: 'Poczekaj 4 min przed ponownym wysłaniem' });
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(
      await screen.findByText('Poczekaj 4 min przed ponownym wysłaniem')
    ).toBeInTheDocument();
  });

  it('shows a generic message for non-Error failures', async () => {
    mockFetch.mockRejectedValue('offline');
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(await screen.findByText('Wystąpił błąd')).toBeInTheDocument();
  });

  it('disables the button while sending', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<EmailVerificationBanner emailVerified={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Wyślij ponownie' })
    );

    expect(screen.getByRole('button', { name: 'Wysyłanie...' })).toBeDisabled();
  });
});
