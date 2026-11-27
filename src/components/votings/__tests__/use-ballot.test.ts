import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBallot } from '@/components/votings/use-ballot';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@/actions/voting/tenant-votings', () => ({
  requestVoteConfirmationAction: mocks.request,
}));

const QUESTIONS = ['q1', 'q2'];
const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

const open = (apartments = ['a1']) =>
  renderHook(() => useBallot('v1', apartments, QUESTIONS));

function answered() {
  const hook = open();
  act(() => hook.result.current.choose('a1', 'q1', 'FOR'));
  act(() => hook.result.current.choose('a1', 'q2', 'AGAINST'));
  return hook;
}

describe('useBallot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ ok: true, data: { expiresAt: 'x' } });
  });

  it('can be sent once an apartment has every answer', () => {
    const { result } = open();
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.choose('a1', 'q1', 'FOR'));
    expect(result.current.progress('a1')).toBe('partial');
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.choose('a1', 'q2', 'ABSTAIN'));
    expect(result.current.progress('a1')).toBe('complete');
    expect(result.current.canSubmit).toBe(true);
  });

  it('keeps each apartment apart and leaves out an empty one', async () => {
    const { result } = open(['a1', 'a2']);
    act(() => result.current.choose('a2', 'q1', 'AGAINST'));
    act(() => result.current.choose('a2', 'q2', 'AGAINST'));
    expect(result.current.progress('a1')).toBe('empty');

    await act(() => result.current.sendLink());

    expect(mocks.request).toHaveBeenCalledWith({
      votingId: 'v1',
      answers: { a2: { q1: 'AGAINST', q2: 'AGAINST' } },
    });
  });

  it('waits for an unfinished apartment until it is cleared', () => {
    const { result } = open(['a1', 'a2']);
    act(() => result.current.choose('a1', 'q1', 'FOR'));
    act(() => result.current.choose('a1', 'q2', 'FOR'));
    act(() => result.current.choose('a2', 'q1', 'FOR'));
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.clear('a2'));

    expect(result.current.canSubmit).toBe(true);
  });

  it('sends the answers and moves on to the email step', async () => {
    const { result } = answered();

    await act(() => result.current.sendLink());

    expect(mocks.request).toHaveBeenCalledWith({
      votingId: 'v1',
      answers: { a1: { q1: 'FOR', q2: 'AGAINST' } },
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
    expect(result.current.answers).toEqual({
      a1: { q1: 'FOR', q2: 'AGAINST' },
    });
  });
});
