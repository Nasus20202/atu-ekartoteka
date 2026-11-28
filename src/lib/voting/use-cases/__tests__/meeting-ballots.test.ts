import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addMeetingBallotUseCase,
  removeMeetingBallotUseCase,
} from '@/lib/voting/use-cases/meeting-ballots';

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  info: vi.fn(),
  record: vi.fn(),
}));

vi.mock('@/lib/voting/queries/find-voting-by-id', () => ({
  findVotingById: mocks.find,
}));
vi.mock('@/lib/voting/mutations/add-meeting-ballot', () => ({
  addMeetingBallot: mocks.add,
}));
vi.mock('@/lib/voting/mutations/delete-meeting-ballot', () => ({
  deleteMeetingBallot: mocks.remove,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: mocks.info }),
}));

vi.mock('@/lib/platform/opentelemetry/voting-metrics', () => ({
  votingMetrics: { recordMeetingBallot: mocks.record },
}));

const UPDATED_AT = new Date('2026-06-01T10:00:00Z');
const VOTING = {
  status: 'DRAFT',
  updatedAt: UPDATED_AT,
  allowAbstain: false,
  hoa: { id: 'h1' },
  questions: [{ id: 'q1' }],
};
const add = (answers: unknown = { q1: 'FOR' }, apartment: unknown = 'a1') =>
  addMeetingBallotUseCase('admin-1', 'v1', apartment, answers);

describe('meeting ballot use cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.find.mockResolvedValue(VOTING);
    mocks.add.mockResolvedValue({ ok: true, ballotId: 'b1' });
    mocks.remove.mockResolvedValue(true);
  });

  it('enters a ballot and logs ids only', async () => {
    expect(await add()).toEqual({ ok: true, data: { id: 'b1' } });
    expect(mocks.add).toHaveBeenCalledWith({
      votingId: 'v1',
      readAt: UPDATED_AT,
      hoaId: 'h1',
      apartmentId: 'a1',
      answers: { q1: 'FOR' },
    });
    expect(mocks.info.mock.calls[0][0]).toEqual({
      adminId: 'admin-1',
      votingId: 'v1',
      ballotId: 'b1',
    });
  });

  it.each([
    ['no apartment', { q1: 'FOR' }, ''],
    ['no answers', {}, 'a1'],
    ['a blocked abstention', { q1: 'ABSTAIN' }, 'a1'],
  ])('rejects %s', async (_, answers, apartment) => {
    expect(await add(answers, apartment)).toMatchObject({ ok: false });
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it.each([
    [null, 'Nie znaleziono głosowania'],
    [{ ...VOTING, status: 'ACTIVE' }, 'tylko w wersji roboczej'],
  ])('rejects the voting %j', async (voting, message) => {
    mocks.find.mockResolvedValue(voting);

    expect(await add()).toMatchObject({
      ok: false,
      message: expect.stringContaining(message),
    });
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it.each([
    ['changed', 'zmienione'],
    ['unknown-apartment', 'aktywny lokal'],
    ['duplicate', 'oddano już głos'],
  ])('explains the refusal %s', async (reason, message) => {
    mocks.add.mockResolvedValue({ ok: false, reason });

    expect(await add()).toMatchObject({
      message: expect.stringContaining(message),
    });
  });

  it('counts an entered and a removed ballot', async () => {
    await add();
    expect(mocks.record).toHaveBeenLastCalledWith('added');

    await removeMeetingBallotUseCase('a', 'v1', 'b1');
    expect(mocks.record).toHaveBeenLastCalledWith('removed');
    expect(mocks.record).toHaveBeenCalledTimes(2);
  });

  it('counts nothing when a ballot is refused or not found', async () => {
    mocks.add.mockResolvedValue({ ok: false, reason: 'duplicate' });
    mocks.remove.mockResolvedValue(false);

    await add();
    await removeMeetingBallotUseCase('a', 'v1', 'b1');

    expect(mocks.record).not.toHaveBeenCalled();
  });

  it('rejects a voting id that is not text', async () => {
    expect(await addMeetingBallotUseCase('a', 1, 'a1', {})).toMatchObject({
      ok: false,
    });
    expect(mocks.find).not.toHaveBeenCalled();
  });

  it('removes a ballot of a draft', async () => {
    expect(await removeMeetingBallotUseCase('a', 'v1', 'b1')).toEqual({
      ok: true,
      data: { id: 'b1' },
    });
  });

  it.each([
    [1, 'b1', true],
    ['v1', null, true],
    ['v1', 'b1', false],
  ])('finds no ballot to remove for %j %j', async (voting, ballot, found) => {
    mocks.remove.mockResolvedValue(found);

    expect(await removeMeetingBallotUseCase('a', voting, ballot)).toMatchObject(
      { ok: false, code: 'not-found' }
    );
  });
});
