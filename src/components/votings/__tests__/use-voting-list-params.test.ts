import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVotingListParams } from '@/components/votings/use-voting-list-params';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/admin/votings',
  useSearchParams: () => new URLSearchParams('hoa=h1&status=ACTIVE&sort=title'),
}));

const params = () => renderHook(() => useVotingListParams()).result.current;

describe('useVotingListParams', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes an emptied filter and keeps the rest', () => {
    params().setHoa('');

    expect(replace).toHaveBeenCalledWith(
      '/admin/votings?status=ACTIVE&sort=title',
      { scroll: false }
    );
  });

  it('clears both filters but not the order', () => {
    params().clearFilters();

    expect(replace).toHaveBeenCalledWith('/admin/votings?sort=title', {
      scroll: false,
    });
  });
});
