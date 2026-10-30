import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InfiniteScrollSentinel } from '@/components/ui/infinite-scroll-sentinel';

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observers: Array<{ callback: ObserverCallback; disconnect: () => void }> =
  [];

class FakeIntersectionObserver {
  disconnect = vi.fn();
  observe = vi.fn();

  constructor(callback: ObserverCallback) {
    observers.push({ callback, disconnect: this.disconnect });
  }
}

function intersect(isIntersecting = true) {
  act(() => observers.at(-1)?.callback([{ isIntersecting }]));
}

const defaults = { hasMore: true, loading: false, error: null };

describe('InfiniteScrollSentinel', () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads more when the sentinel becomes visible', () => {
    const onLoadMore = vi.fn();
    render(<InfiniteScrollSentinel {...defaults} onLoadMore={onLoadMore} />);

    intersect(false);
    expect(onLoadMore).not.toHaveBeenCalled();
    intersect();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('offers a manual button that loads more', () => {
    const onLoadMore = vi.fn();
    render(<InfiniteScrollSentinel {...defaults} onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż więcej' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner and stops observing while loading', () => {
    const { rerender } = render(
      <InfiniteScrollSentinel {...defaults} onLoadMore={vi.fn()} />
    );
    const firstObserver = observers[0];

    rerender(
      <InfiniteScrollSentinel {...defaults} loading onLoadMore={vi.fn()} />
    );

    expect(firstObserver.disconnect).toHaveBeenCalled();
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the error and only retries manually', () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScrollSentinel
        {...defaults}
        error="Nie udało się"
        onLoadMore={onLoadMore}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się');
    expect(observers).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Pokaż więcej' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when everything is loaded', () => {
    const { container } = render(
      <InfiniteScrollSentinel
        {...defaults}
        hasMore={false}
        onLoadMore={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the button when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<InfiniteScrollSentinel {...defaults} onLoadMore={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Pokaż więcej' })
    ).toBeInTheDocument();
  });
});
