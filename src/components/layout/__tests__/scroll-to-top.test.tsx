import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollToTop } from '@/components/layout/scroll-to-top';

const mocks = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }));

describe('ScrollToTop', () => {
  beforeEach(() => {
    mocks.pathname = '/dashboard';
    window.location.hash = '';
    window.scrollTo = vi.fn();
  });

  it('leaves the browser scroll position alone on mount', () => {
    render(<ScrollToTop />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to the top when the pathname changes', () => {
    const { rerender } = render(<ScrollToTop />);
    mocks.pathname = '/dashboard/payments';
    rerender(<ScrollToTop />);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does not scroll on a re-render with the same pathname', () => {
    const { rerender } = render(<ScrollToTop />);
    rerender(<ScrollToTop />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('keeps the position when the new URL has a hash', () => {
    const { rerender } = render(<ScrollToTop />);
    mocks.pathname = '/dashboard/payments';
    window.location.hash = '#section';
    rerender(<ScrollToTop />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
