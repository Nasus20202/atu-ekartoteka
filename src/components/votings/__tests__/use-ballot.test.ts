import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBallot } from '@/components/votings/use-ballot';

const mocks = vi.hoisted(() => ({ request: vi.fn(), confirm: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  requestVoteConfirmationAction: mocks.request,
  confirmVoteAction: mocks.confirm,
}));

const QUESTIONS = ['q1', 'q2'];

function answered() {
  const hook = renderHook(() => useBallot('v1', QUESTIONS));
  act(() => hook.result.current.choose('q1', 'FOR'));
  act(() => hook.result.current.choose('q2', 'AGAINST'));
  return hook;
}

describe('useBallot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });
    mocks.confirm.mockResolvedValue({ ok: true, data: { ballots: 2 } });
  });

  it('is complete only when every question has an answer', () => {
    const { result } = renderHook(() => useBallot('v1', QUESTIONS));
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.choose('q1', 'FOR'));
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.choose('q2', 'ABSTAIN'));
    expect(result.current.isComplete).toBe(true);
  });

  it('sends the answers and moves on to the code step', async () => {
    const { result } = answered();

    await act(() => result.current.requestCode());

    expect(mocks.request).toHaveBeenCalledWith({
      votingId: 'v1',
      answers: { q1: 'FOR', q2: 'AGAINST' },
    });
    expect(result.current.stage).toBe('code');
    expect(result.current.notice).toBe('Wysłaliśmy kod na Twój adres email');
  });

  it('stays on the answers and shows the reason when the code cannot be sent', async () => {
    mocks.request.mockResolvedValue({ ok: false, error: 'Za wcześnie' });
    const { result } = answered();

    await act(() => result.current.requestCode());

    expect(result.current.stage).toBe('answer');
    expect(result.current.error).toBe('Za wcześnie');
  });

  it('finishes after the right code and reports how many apartments voted', async () => {
    const { result } = answered();
    await act(() => result.current.requestCode());
    act(() => result.current.setCode('123456'));

    await act(() => result.current.confirm());

    expect(mocks.confirm).toHaveBeenCalledWith({
      votingId: 'v1',
      code: '123456',
    });
    expect(result.current.stage).toBe('done');
    expect(result.current.castCount).toBe(2);
  });

  it('keeps the code step and the error after a wrong code', async () => {
    mocks.confirm.mockResolvedValue({ ok: false, error: 'Nieprawidłowy kod' });
    const { result } = answered();
    await act(() => result.current.requestCode());

    await act(() => result.current.confirm());

    expect(result.current.stage).toBe('code');
    expect(result.current.error).toBe('Nieprawidłowy kod');
  });

  it('reports a failed request instead of throwing', async () => {
    mocks.request.mockRejectedValue(new Error('network'));
    const { result } = answered();

    await act(() => result.current.requestCode());

    expect(result.current.error).toBe('Coś poszło nie tak. Spróbuj ponownie');
    expect(result.current.pending).toBe(false);
  });

  it('goes back to the answers without losing them', async () => {
    const { result } = answered();
    await act(() => result.current.requestCode());

    act(() => result.current.backToAnswers());

    expect(result.current.stage).toBe('answer');
    expect(result.current.answers).toEqual({ q1: 'FOR', q2: 'AGAINST' });
  });
});
