import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard/settlements/a1',
  useSearchParams: () => new URLSearchParams('period=u1&year=r1'),
}));

import { useSettlementParams } from '@/components/settlements/use-settlement-params';

describe('useSettlementParams', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces one parameter and keeps the others', () => {
    const { result } = renderHook(() => useSettlementParams());

    result.current.select('period', 'u2');

    expect(replace).toHaveBeenCalledWith(
      '/dashboard/settlements/a1?period=u2&year=r1',
      { scroll: false }
    );
  });

  it('sets several parameters at once and removes the null ones', () => {
    const { result } = renderHook(() => useSettlementParams());

    result.current.update({ year: null, readingSort: 'consumption' });

    expect(replace).toHaveBeenCalledWith(
      '/dashboard/settlements/a1?period=u1&readingSort=consumption',
      { scroll: false }
    );
  });
});
