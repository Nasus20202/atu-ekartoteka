import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMeetingBallots } from '@/components/votings/use-meeting-ballots';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  refresh: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@/actions/voting/meeting-ballots', () => ({
  addMeetingBallotAction: mocks.add,
  removeMeetingBallotAction: mocks.remove,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('@/components/votings/use-meeting-apartments', () => ({
  useMeetingApartments: () => ({
    options: [{ id: 'a1', label: 'Lipowa 1/2' }],
    refresh: mocks.reload,
  }),
}));

const open = () => renderHook(() => useMeetingBallots('v1', ['q1', 'q2']));

describe('useMeetingBallots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
    mocks.remove.mockResolvedValue({ ok: true });
  });

  it('is complete with a listed apartment and an answer to every question', () => {
    const { result } = open();

    act(() => result.current.choose('q1', 'FOR'));
    act(() => result.current.choose('q2', 'AGAINST'));
    expect(result.current.complete).toBe(false);

    act(() => result.current.chooseApartment('missing'));
    expect(result.current.apartment).toBeNull();

    act(() => result.current.chooseApartment('a1'));
    expect(result.current.complete).toBe(true);
  });

  it('removes a confirmed ballot and reads the lists again', async () => {
    const { result } = open();

    await act(() => result.current.remove('b1', 'Lipowa 1/2'));

    expect(mocks.remove).toHaveBeenCalledWith({
      votingId: 'v1',
      ballotId: 'b1',
    });
    expect(mocks.reload).toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
  });

  it('says why a ballot could not be removed', async () => {
    mocks.remove.mockResolvedValue({ ok: false });
    const { result } = open();

    await act(() => result.current.remove('b1', 'Lipowa 1/2'));

    expect(result.current.error).toBe('Nie udało się usunąć głosu');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
