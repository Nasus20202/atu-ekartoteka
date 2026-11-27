import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotifyVoters } from '@/components/votings/use-notify-voters';

const mocks = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@/actions/voting/admin-votings', () => ({
  notifyVotersAction: mocks.notify,
}));

const VOTERS = [
  {
    id: 'u1',
    name: 'Anna',
    email: 'a@example.com',
    apartmentCount: 1,
    hasVoted: true,
  },
  {
    id: 'u2',
    name: 'Jan',
    email: 'j@example.com',
    apartmentCount: 1,
    hasVoted: false,
  },
  {
    id: 'u3',
    name: 'Ewa',
    email: 'e@example.com',
    apartmentCount: 2,
    hasVoted: false,
  },
];

describe('useNotifyVoters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notify.mockResolvedValue({ ok: true, data: { sent: 2, failed: 0 } });
  });

  it('preselects the voters who have not voted', () => {
    const { result } = renderHook(() => useNotifyVoters('v1', VOTERS));

    act(() => result.current.openDialog());

    expect(result.current.open).toBe(true);
    expect([...result.current.selected].sort()).toEqual(['u2', 'u3']);
  });

  it('toggles single voters and selects everyone or only the pending ones', () => {
    const { result } = renderHook(() => useNotifyVoters('v1', VOTERS));
    act(() => result.current.openDialog());

    act(() => result.current.toggle('u2'));
    expect([...result.current.selected]).toEqual(['u3']);
    act(() => result.current.selectAll());
    expect(result.current.selected.size).toBe(3);
    act(() => result.current.selectPending());
    expect(result.current.selected.size).toBe(2);
  });

  it('sends the selected ids and reports the result', async () => {
    const { result } = renderHook(() => useNotifyVoters('v1', VOTERS));
    act(() => result.current.openDialog());

    await act(() => result.current.send());

    expect(mocks.notify).toHaveBeenCalledWith({
      votingId: 'v1',
      userIds: ['u2', 'u3'],
    });
    expect(result.current.outcome).toEqual({
      kind: 'sent',
      sent: 2,
      failed: 0,
    });
  });

  it('shows the error when sending is refused', async () => {
    mocks.notify.mockResolvedValue({ ok: false, error: 'Nie aktywne' });
    const { result } = renderHook(() => useNotifyVoters('v1', VOTERS));
    act(() => result.current.openDialog());

    await act(() => result.current.send());

    expect(result.current.outcome).toEqual({
      kind: 'error',
      message: 'Nie aktywne',
    });
  });
});
