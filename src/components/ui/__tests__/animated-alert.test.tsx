import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnimatedAlert } from '@/components/ui/animated-alert';
import { PRESENCE_EXIT_MS } from '@/hooks/use-presence';

describe('AnimatedAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when hidden', () => {
    render(<AnimatedAlert show={false}>Błąd</AnimatedAlert>);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders an open alert when shown', () => {
    render(<AnimatedAlert show>Błąd</AnimatedAlert>);

    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'open');
    expect(screen.getByText('Błąd')).toBeInTheDocument();
  });

  it('applies the requested variant and className', () => {
    render(
      <AnimatedAlert show variant="destructive" className="custom">
        Błąd
      </AnimatedAlert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('text-destructive', 'custom');
  });

  it('keeps the message and closes while animating out', () => {
    const { rerender } = render(<AnimatedAlert show>Błąd</AnimatedAlert>);

    rerender(<AnimatedAlert show={false}>{''}</AnimatedAlert>);

    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'closed');
    expect(screen.getByText('Błąd')).toBeInTheDocument();
  });

  it('unmounts after the exit animation', () => {
    const { rerender } = render(<AnimatedAlert show>Błąd</AnimatedAlert>);

    rerender(<AnimatedAlert show={false}>{''}</AnimatedAlert>);
    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_MS);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
