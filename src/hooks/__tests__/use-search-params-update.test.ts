import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchParamsUpdate } from '@/hooks/use-search-params-update';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/list',
  useSearchParams: () => new URLSearchParams('a=1&b=2'),
}));

const update = (values: Record<string, string | null>) =>
  renderHook(() => useSearchParamsUpdate()).result.current.update(values);

describe('useSearchParamsUpdate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets values and keeps the other parameters', () => {
    update({ b: '3', c: '4' });

    expect(replace).toHaveBeenCalledWith('/list?a=1&b=3&c=4', {
      scroll: false,
    });
  });

  it.each([null, ''])('removes a parameter given %j', (value) => {
    update({ a: value });

    expect(replace).toHaveBeenCalledWith('/list?b=2', { scroll: false });
  });

  it('leaves the bare path without parameters', () => {
    update({ a: null, b: null });

    expect(replace).toHaveBeenCalledWith('/list', { scroll: false });
  });
});
