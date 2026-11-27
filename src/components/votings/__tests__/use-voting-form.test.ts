import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVotingForm } from '@/components/votings/use-voting-form';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/actions/voting/admin-votings', () => ({
  createVotingAction: mocks.create,
  updateVotingAction: mocks.update,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const EMPTY = {
  hoaId: 'hoa-1',
  title: 'Remont',
  description: '',
  endsAt: null,
  questions: [],
};

describe('useVotingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ ok: true, data: { id: 'v1' } });
    mocks.update.mockResolvedValue({ ok: true, data: { id: 'v1' } });
  });

  it('starts a new voting with one empty question', () => {
    const { result } = renderHook(() => useVotingForm(EMPTY));

    expect(result.current.fields.questions).toHaveLength(1);
    expect(result.current.canRemoveQuestion).toBe(false);
  });

  it('adds, edits, moves and removes questions', () => {
    const { result } = renderHook(() => useVotingForm(EMPTY));

    act(() => result.current.addQuestion());
    const [first, second] = result.current.fields.questions;
    act(() => result.current.changeQuestion(first.key, 'A'));
    act(() => result.current.changeQuestion(second.key, 'B'));
    act(() => result.current.moveQuestion(second.key, -1));
    expect(result.current.fields.questions.map((q) => q.text)).toEqual([
      'B',
      'A',
    ]);

    act(() => result.current.removeQuestion(first.key));
    expect(result.current.fields.questions.map((q) => q.text)).toEqual(['B']);
  });

  it('stops adding at twenty questions', () => {
    const { result } = renderHook(() => useVotingForm(EMPTY));

    for (let i = 0; i < 25; i++) act(() => result.current.addQuestion());

    expect(result.current.fields.questions).toHaveLength(20);
    expect(result.current.canAddQuestion).toBe(false);
  });

  it('creates the voting and opens it', async () => {
    const { result } = renderHook(() => useVotingForm(EMPTY));
    act(() =>
      result.current.changeQuestion(
        result.current.fields.questions[0].key,
        'Czy?'
      )
    );

    await act(() => result.current.submit());

    expect(mocks.create).toHaveBeenCalledWith({
      hoaId: 'hoa-1',
      title: 'Remont',
      description: '',
      endsAt: null,
      questions: [{ text: 'Czy?' }],
    });
    expect(mocks.push).toHaveBeenCalledWith('/admin/votings/v1');
  });

  it('sends the deadline as an absolute instant', async () => {
    const { result } = renderHook(() => useVotingForm(EMPTY));
    act(() => result.current.setEndsAt('2026-12-31T10:00'));

    await act(() => result.current.submit());

    expect(mocks.create.mock.calls[0][0].endsAt).toBe(
      new Date('2026-12-31T10:00').toISOString()
    );
  });

  it('updates an existing draft', async () => {
    const { result } = renderHook(() =>
      useVotingForm({ ...EMPTY, votingId: 'v1', questions: ['Czy?'] })
    );

    await act(() => result.current.submit());

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ votingId: 'v1' })
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('shows the server message and stays when saving fails', async () => {
    mocks.create.mockResolvedValue({
      ok: false,
      error: 'Podaj tytuł głosowania',
    });
    const { result } = renderHook(() => useVotingForm(EMPTY));

    await act(() => result.current.submit());

    expect(result.current.error).toBe('Podaj tytuł głosowania');
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
