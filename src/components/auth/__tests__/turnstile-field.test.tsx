import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TurnstileField } from '@/components/auth/turnstile-field';
import { useTurnstile } from '@/hooks/use-turnstile';

const { config } = vi.hoisted(() => ({
  config: {
    current: null as { siteKey: string | null; enabled: boolean } | null,
  },
}));

vi.mock('@/hooks/use-turnstile-config', () => ({
  useTurnstileConfig: () => config.current,
}));

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({
    siteKey,
    options,
    onSuccess,
    onExpire,
    onError,
  }: {
    siteKey: string;
    options?: { theme: string; size: string; language: string };
    onSuccess: (token: string) => void;
    onExpire: () => void;
    onError: () => void;
  }) => (
    <div
      data-testid="turnstile"
      data-site-key={siteKey}
      data-theme={options?.theme}
      data-size={options?.size}
      data-language={options?.language}
    >
      <button onClick={() => onSuccess('solved')}>solve</button>
      <button onClick={onExpire}>expire</button>
      <button onClick={onError}>fail</button>
    </div>
  ),
}));

describe('useTurnstile', () => {
  it('is pending until an enabled challenge is solved, then resets', () => {
    config.current = { siteKey: 'key', enabled: true };
    const { result } = renderHook(() => useTurnstile());

    expect(result.current.isPending).toBe(true);
    act(() => result.current.setToken('token'));
    expect(result.current.isPending).toBe(false);
    expect(result.current.token).toBe('token');

    act(() => result.current.reset());
    expect(result.current.token).toBeNull();
  });

  it('never blocks when turnstile is disabled or loading', () => {
    config.current = null;
    expect(renderHook(() => useTurnstile()).result.current.isPending).toBe(
      false
    );
  });
});

describe('TurnstileField', () => {
  function Harness() {
    const turnstile = useTurnstile();
    return (
      <>
        <TurnstileField turnstile={turnstile} />
        <output>{turnstile.token ?? 'none'}</output>
      </>
    );
  }

  it('reserves the widget slot while the config is loading', () => {
    config.current = null;
    render(<Harness />);

    expect(screen.getByTestId('turnstile-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('turnstile')).not.toBeInTheDocument();
  });

  it('renders nothing without an enabled site key', () => {
    config.current = { siteKey: null, enabled: true };
    render(<Harness />);
    expect(screen.queryByTestId('turnstile')).not.toBeInTheDocument();
    expect(screen.queryByTestId('turnstile-skeleton')).not.toBeInTheDocument();
  });

  it('renders nothing when turnstile is disabled', () => {
    config.current = { siteKey: null, enabled: false };
    render(<Harness />);

    expect(screen.queryByTestId('turnstile')).not.toBeInTheDocument();
    expect(screen.queryByTestId('turnstile-skeleton')).not.toBeInTheDocument();
  });

  it('renders the widget with the themed flexible layout', () => {
    config.current = { siteKey: 'key', enabled: true };
    render(<Harness />);

    const widget = screen.getByTestId('turnstile');
    expect(widget).toHaveAttribute('data-theme', 'auto');
    expect(widget).toHaveAttribute('data-size', 'flexible');
    expect(widget).toHaveAttribute('data-language', 'pl');
  });

  it('tracks the token through the widget callbacks', () => {
    config.current = { siteKey: 'key', enabled: true };
    render(<Harness />);

    expect(screen.getByTestId('turnstile')).toHaveAttribute(
      'data-site-key',
      'key'
    );
    act(() => screen.getByText('solve').click());
    expect(screen.getByRole('status')).toHaveTextContent('solved');
    act(() => screen.getByText('expire').click());
    expect(screen.getByRole('status')).toHaveTextContent('none');
    act(() => screen.getByText('solve').click());
    act(() => screen.getByText('fail').click());
    expect(screen.getByRole('status')).toHaveTextContent('none');
  });
});
