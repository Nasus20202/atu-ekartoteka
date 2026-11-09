import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GoogleSignInSlot } from '@/components/auth/google-sign-in';

/** A fresh cache per test, so one test's response is not seen by the next. */
function freshCache({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    { value: { provider: () => new Map() } },
    children
  );
}

function stubConfig(enabled: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled }),
    })
  );
}

describe('GoogleSignInSlot', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reserves the OAuth slot while the config is loading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );

    render(<GoogleSignInSlot onClick={vi.fn()} />, { wrapper: freshCache });

    expect(screen.getByTestId('google-slot-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Lub')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Zaloguj się przez Google/ })
    ).not.toBeInTheDocument();
  });

  it('renders the divider and button when Google is enabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    stubConfig(true);

    render(<GoogleSignInSlot onClick={onClick} />, { wrapper: freshCache });

    const button = await screen.findByRole('button', {
      name: /Zaloguj się przez Google/,
    });
    expect(screen.getByText('Lub')).toBeInTheDocument();
    expect(
      screen.queryByTestId('google-slot-skeleton')
    ).not.toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders nothing when Google is disabled', async () => {
    stubConfig(false);

    render(<GoogleSignInSlot onClick={vi.fn()} />, { wrapper: freshCache });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/config/google')
    );
    expect(
      screen.queryByTestId('google-slot-skeleton')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Lub')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Zaloguj się przez Google/ })
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the config request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    );

    render(<GoogleSignInSlot onClick={vi.fn()} />, { wrapper: freshCache });

    await waitFor(() =>
      expect(
        screen.queryByTestId('google-slot-skeleton')
      ).not.toBeInTheDocument()
    );
    expect(screen.queryByText('Lub')).not.toBeInTheDocument();
  });
});
