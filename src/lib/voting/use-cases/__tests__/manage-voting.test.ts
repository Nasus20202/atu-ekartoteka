import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  changeVotingStatusUseCase,
  createVotingUseCase,
  deleteVotingUseCase,
  updateVotingUseCase,
} from '@/lib/voting/use-cases/manage-voting';

const mocks = vi.hoisted(() => ({
  createVoting: vi.fn(),
  updateDraftVoting: vi.fn(),
  changeVotingStatus: vi.fn(),
  deleteDraftVoting: vi.fn(),
  findVotingById: vi.fn(),
  hoaExists: vi.fn(),
}));

vi.mock('@/lib/voting/mutations/create-voting', () => ({
  createVoting: mocks.createVoting,
}));
vi.mock('@/lib/voting/mutations/update-draft-voting', () => ({
  updateDraftVoting: mocks.updateDraftVoting,
}));
vi.mock('@/lib/voting/mutations/change-voting-status', () => ({
  changeVotingStatus: mocks.changeVotingStatus,
}));
vi.mock('@/lib/voting/mutations/delete-draft-voting', () => ({
  deleteDraftVoting: mocks.deleteDraftVoting,
}));
vi.mock('@/lib/voting/queries/find-voting-by-id', () => ({
  findVotingById: mocks.findVotingById,
}));
vi.mock('@/lib/voting/queries/hoa-exists', () => ({
  hoaExists: mocks.hoaExists,
}));
vi.mock('@/lib/platform/logging/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const INPUT = {
  hoaId: 'hoa-1',
  title: 'Remont',
  questions: [{ text: 'Czy?' }],
};

function voting(status: string, endsAt: Date | null = null) {
  return { id: 'v1', status, endsAt };
}

describe('manage voting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hoaExists.mockResolvedValue(true);
    mocks.createVoting.mockResolvedValue({ id: 'v1' });
    mocks.updateDraftVoting.mockResolvedValue(true);
    mocks.changeVotingStatus.mockResolvedValue(true);
    mocks.deleteDraftVoting.mockResolvedValue(true);
  });

  describe('create', () => {
    it('creates a draft for an existing HOA', async () => {
      const result = await createVotingUseCase('admin-1', INPUT);

      expect(result).toEqual({ ok: true, data: { id: 'v1' } });
      expect(mocks.createVoting).toHaveBeenCalledWith(
        expect.objectContaining({ hoaId: 'hoa-1', title: 'Remont' })
      );
    });

    it('rejects invalid input and an unknown HOA without writing', async () => {
      expect(
        await createVotingUseCase('a', { ...INPUT, questions: [] })
      ).toMatchObject({
        ok: false,
        code: 'invalid',
      });

      mocks.hoaExists.mockResolvedValue(false);
      expect(await createVotingUseCase('a', INPUT)).toMatchObject({
        ok: false,
        message: 'Nie znaleziono wspólnoty',
      });
      expect(mocks.createVoting).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a draft', async () => {
      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));

      expect(await updateVotingUseCase('a', 'v1', INPUT)).toEqual({
        ok: true,
        data: { id: 'v1' },
      });
    });

    it('refuses to edit a published voting', async () => {
      mocks.findVotingById.mockResolvedValue(voting('ACTIVE'));

      expect(await updateVotingUseCase('a', 'v1', INPUT)).toMatchObject({
        ok: false,
        code: 'invalid',
      });
      expect(mocks.updateDraftVoting).not.toHaveBeenCalled();
    });

    it('reports a missing voting and a lost race', async () => {
      mocks.findVotingById.mockResolvedValue(null);
      expect(await updateVotingUseCase('a', 'v1', INPUT)).toMatchObject({
        code: 'not-found',
      });

      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));
      mocks.updateDraftVoting.mockResolvedValue(false);
      expect(await updateVotingUseCase('a', 'v1', INPUT)).toMatchObject({
        code: 'invalid',
      });
    });
  });

  describe('change status', () => {
    it('publishes a draft', async () => {
      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));

      expect(await changeVotingStatusUseCase('a', 'v1', 'ACTIVE')).toEqual({
        ok: true,
        data: { status: 'ACTIVE' },
      });
      expect(mocks.changeVotingStatus).toHaveBeenCalledWith(
        'v1',
        'DRAFT',
        'ACTIVE'
      );
    });

    it('rejects a transition that is not allowed', async () => {
      mocks.findVotingById.mockResolvedValue(voting('ARCHIVED'));

      expect(
        await changeVotingStatusUseCase('a', 'v1', 'ACTIVE')
      ).toMatchObject({
        ok: false,
        code: 'invalid',
      });
      expect(mocks.changeVotingStatus).not.toHaveBeenCalled();
    });

    it('does not publish a draft whose deadline has passed', async () => {
      mocks.findVotingById.mockResolvedValue(
        voting('DRAFT', new Date('2020-01-01'))
      );

      expect(
        await changeVotingStatusUseCase('a', 'v1', 'ACTIVE')
      ).toMatchObject({
        message: 'Termin głosowania już minął',
      });
    });

    it('rejects an unknown status', async () => {
      expect(await changeVotingStatusUseCase('a', 'v1', 'DONE')).toMatchObject({
        code: 'invalid',
      });
    });
  });

  describe('gaps', () => {
    it('rejects an update with an unknown HOA and a non-string id', async () => {
      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));
      mocks.hoaExists.mockResolvedValue(false);

      expect(await updateVotingUseCase('a', 'v1', INPUT)).toMatchObject({
        message: 'Nie znaleziono wspólnoty',
      });
      expect(await updateVotingUseCase('a', 42, INPUT)).toMatchObject({
        ok: false,
      });
      expect(await deleteVotingUseCase('a', 42)).toMatchObject({ ok: false });
    });

    it('reports a status change that lost a race and a missing voting', async () => {
      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));
      mocks.changeVotingStatus.mockResolvedValue(false);
      expect(
        await changeVotingStatusUseCase('a', 'v1', 'ACTIVE')
      ).toMatchObject({
        code: 'invalid',
      });

      mocks.findVotingById.mockResolvedValue(null);
      expect(
        await changeVotingStatusUseCase('a', 'v1', 'ACTIVE')
      ).toMatchObject({
        code: 'not-found',
      });
    });

    it('reports a missing draft and a delete that lost a race', async () => {
      mocks.findVotingById.mockResolvedValue(null);
      expect(await deleteVotingUseCase('a', 'v1')).toMatchObject({
        code: 'not-found',
      });

      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));
      mocks.deleteDraftVoting.mockResolvedValue(false);
      expect(await deleteVotingUseCase('a', 'v1')).toMatchObject({
        code: 'failed',
      });
    });
  });

  describe('delete', () => {
    it('deletes a draft only', async () => {
      mocks.findVotingById.mockResolvedValue(voting('DRAFT'));
      expect(await deleteVotingUseCase('a', 'v1')).toMatchObject({ ok: true });

      mocks.findVotingById.mockResolvedValue(voting('ACTIVE'));
      expect(await deleteVotingUseCase('a', 'v1')).toMatchObject({ ok: false });
      expect(mocks.deleteDraftVoting).toHaveBeenCalledTimes(1);
    });
  });
});
