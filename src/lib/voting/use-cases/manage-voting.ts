import { createLogger } from '@/lib/platform/logging/logger';
import {
  failedResult,
  invalidResult,
  notFoundResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import { changeVotingStatus } from '@/lib/voting/mutations/change-voting-status';
import { createVoting } from '@/lib/voting/mutations/create-voting';
import { deleteDraftVoting } from '@/lib/voting/mutations/delete-draft-voting';
import { updateDraftVoting } from '@/lib/voting/mutations/update-draft-voting';
import { findVotingById } from '@/lib/voting/queries/find-voting-by-id';
import { hoaExists } from '@/lib/voting/queries/hoa-exists';
import { parseVotingInput } from '@/lib/voting/rules/voting-input';
import {
  canTransition,
  isEditableStatus,
  isVotingStatus,
} from '@/lib/voting/rules/voting-status';
import { VotingStatus } from '@/lib/voting/types/voting';

const logger = createLogger('voting:manage');

const NOT_FOUND = 'Nie znaleziono głosowania';
const NOT_EDITABLE = 'Tylko wersję roboczą można edytować lub usunąć';
const UNKNOWN_HOA = 'Nie znaleziono wspólnoty';
const CONFLICT = 'Głosowanie zostało w międzyczasie zmienione';
const DEADLINE_PASSED = 'Termin głosowania już minął';

export async function createVotingUseCase(
  adminId: string,
  raw: unknown
): Promise<UseCaseResult<{ id: string }>> {
  const parsed = parseVotingInput(raw);
  if (!parsed.ok) return invalidResult(parsed.message);

  if (!(await hoaExists(parsed.value.hoaId))) {
    return invalidResult(UNKNOWN_HOA);
  }

  const { id } = await createVoting(parsed.value);
  logger.info({ adminId, votingId: id }, 'Voting created');

  return { ok: true, data: { id } };
}

export async function updateVotingUseCase(
  adminId: string,
  votingId: unknown,
  raw: unknown
): Promise<UseCaseResult<{ id: string }>> {
  if (typeof votingId !== 'string') return invalidResult(NOT_FOUND);

  const parsed = parseVotingInput(raw);
  if (!parsed.ok) return invalidResult(parsed.message);

  const voting = await findVotingById(votingId);
  if (!voting) return notFoundResult(NOT_FOUND);
  if (!isEditableStatus(voting.status)) return invalidResult(NOT_EDITABLE);

  if (!(await hoaExists(parsed.value.hoaId))) {
    return invalidResult(UNKNOWN_HOA);
  }

  if (!(await updateDraftVoting(votingId, parsed.value))) {
    return invalidResult(CONFLICT);
  }

  logger.info({ adminId, votingId }, 'Voting updated');

  return { ok: true, data: { id: votingId } };
}

export async function changeVotingStatusUseCase(
  adminId: string,
  votingId: unknown,
  status: unknown
): Promise<UseCaseResult<{ status: VotingStatus }>> {
  if (typeof votingId !== 'string' || !isVotingStatus(status)) {
    return invalidResult('Nieprawidłowe dane');
  }

  const voting = await findVotingById(votingId);
  if (!voting) return notFoundResult(NOT_FOUND);

  if (!canTransition(voting.status, status)) {
    return invalidResult('Nie można zmienić statusu głosowania w ten sposób');
  }

  if (
    status === VotingStatus.ACTIVE &&
    voting.endsAt &&
    voting.endsAt.getTime() <= Date.now()
  ) {
    return invalidResult(DEADLINE_PASSED);
  }

  if (!(await changeVotingStatus(votingId, voting.status, status))) {
    return invalidResult(CONFLICT);
  }

  logger.info({ adminId, votingId, status }, 'Voting status changed');

  return { ok: true, data: { status } };
}

export async function deleteVotingUseCase(
  adminId: string,
  votingId: unknown
): Promise<UseCaseResult<{ id: string }>> {
  if (typeof votingId !== 'string') return invalidResult(NOT_FOUND);

  const voting = await findVotingById(votingId);
  if (!voting) return notFoundResult(NOT_FOUND);
  if (!isEditableStatus(voting.status)) return invalidResult(NOT_EDITABLE);

  if (!(await deleteDraftVoting(votingId))) {
    return failedResult(CONFLICT);
  }

  logger.info({ adminId, votingId }, 'Voting deleted');

  return { ok: true, data: { id: votingId } };
}
