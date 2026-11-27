import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConfirmVote } from '@/components/votings/use-confirm-vote';

const mocks = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  confirmVoteAction: mocks.confirm,
}));

const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

describe('useConfirmVote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue({
      ok: true,
      data: { ballots: 2, votingId: 'v1' },
    });
  });

  it('sends the token and reports how many apartments voted', async () => {
    const { result } = renderHook(() => useConfirmVote('tok'));
    expect(result.current.castCount).toBeNull();

    await act(() => result.current.confirm());

    expect(mocks.confirm).toHaveBeenCalledWith({ token: 'tok' });
    expect(result.current.castCount).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it('shows the reason a link was refused', async () => {
    mocks.confirm.mockResolvedValue({ ok: false, error: 'Link wygasł' });
    const { result } = renderHook(() => useConfirmVote('tok'));

    await act(() => result.current.confirm());

    expect(result.current.error).toBe('Link wygasł');
    expect(result.current.castCount).toBeNull();
  });

  it('uses the generic message when a refusal has no text', async () => {
    mocks.confirm.mockResolvedValue({ ok: false, error: '' });
    const { result } = renderHook(() => useConfirmVote('tok'));

    await act(() => result.current.confirm());

    expect(result.current.error).toBe(FAILURE);
  });

  it('reports a failed request instead of throwing', async () => {
    mocks.confirm.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useConfirmVote('tok'));

    await act(() => result.current.confirm());

    expect(result.current.error).toBe(FAILURE);
    expect(result.current.pending).toBe(false);
  });
});
