import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBallot } from '@/components/votings/use-ballot';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  requestVoteConfirmationAction: mocks.request,
}));

const QUESTIONS = ['q1', 'q2'];
const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

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
  });

  it('is complete only when every question has an answer', () => {
    const { result } = renderHook(() => useBallot('v1', QUESTIONS));
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.choose('q1', 'FOR'));
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.choose('q2', 'ABSTAIN'));
    expect(result.current.isComplete).toBe(true);
  });

  it('sends the answers and moves on to the email step', async () => {
    const { result } = answered();

    await act(() => result.current.sendLink());

    expect(mocks.request).toHaveBeenCalledWith({
      votingId: 'v1',
      answers: { q1: 'FOR', q2: 'AGAINST' },
    });
    expect(result.current.stage).toBe('sent');
    expect(result.current.notice).toBe(
      'Wysłaliśmy link potwierdzający na Twój adres email'
    );
  });

  it('stays on the answers and shows the reason when the link cannot be sent', async () => {
    mocks.request.mockResolvedValue({ ok: false, error: 'Za wcześnie' });
    const { result } = answered();

    await act(() => result.current.sendLink());

    expect(result.current.stage).toBe('answer');
    expect(result.current.error).toBe('Za wcześnie');
  });

  it('reports a failed request instead of throwing', async () => {
    mocks.request.mockRejectedValue(new Error('network'));
    const { result } = answered();

    await act(() => result.current.sendLink());

    expect(result.current.error).toBe(FAILURE);
    expect(result.current.pending).toBe(false);
  });

  it('uses the generic message when a refusal has no text', async () => {
    mocks.request.mockResolvedValue({ ok: false, error: '' });
    const { result } = answered();

    await act(() => result.current.sendLink());

    expect(result.current.error).toBe(FAILURE);
  });

  it('goes back to the answers without losing them', async () => {
    const { result } = answered();
    await act(() => result.current.sendLink());

    act(() => result.current.backToAnswers());

    expect(result.current.stage).toBe('answer');
    expect(result.current.notice).toBeNull();
    expect(result.current.answers).toEqual({ q1: 'FOR', q2: 'AGAINST' });
  });
});
