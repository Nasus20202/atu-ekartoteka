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

  it('scrolls to the top on mount', () => {
    render(<ScrollToTop />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('scrolls to the top again when the pathname changes', () => {
    const { rerender } = render(<ScrollToTop />);
    mocks.pathname = '/dashboard/payments';
    rerender(<ScrollToTop />);
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });

  it('keeps the position when the URL has a hash', () => {
    window.location.hash = '#section';
    render(<ScrollToTop />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
