import { createLogger } from '@/lib/platform/logging/logger';
import {
  invalidResult,
  notFoundResult,
  type UseCaseResult,
} from '@/lib/shared/use-case-result';
import {
  addMeetingBallot,
  type AddMeetingBallotResult,
} from '@/lib/voting/mutations/add-meeting-ballot';
import { deleteMeetingBallot } from '@/lib/voting/mutations/delete-meeting-ballot';
import { findVotingById } from '@/lib/voting/queries/find-voting-by-id';
import { parseAnswers } from '@/lib/voting/rules/voting-input';
import {
  isEditableStatus,
  voteChoices,
} from '@/lib/voting/rules/voting-status';

const logger = createLogger('voting:meeting-ballots');

const NOT_FOUND = 'Nie znaleziono głosowania';
const NOT_DRAFT = 'Głosy z zebrania można zmieniać tylko w wersji roboczej';
const NO_BALLOT = 'Nie znaleziono głosu z zebrania w wersji roboczej';

const FAILURES: Record<
  Extract<AddMeetingBallotResult, { ok: false }>['reason'],
  string
> = {
  changed: 'Głosowanie zostało w międzyczasie zmienione. Spróbuj ponownie',
  'unknown-apartment': 'Wybierz aktywny lokal tej wspólnoty',
  duplicate: 'Za ten lokal oddano już głos',
};

/** Stores the vote an apartment cast at a meeting, entered into a draft. */
export async function addMeetingBallotUseCase(
  adminId: string,
  votingId: unknown,
  apartmentId: unknown,
  rawAnswers: unknown
): Promise<UseCaseResult<{ id: string }>> {
  if (typeof votingId !== 'string') return invalidResult(NOT_FOUND);
  if (typeof apartmentId !== 'string' || !apartmentId) {
    return invalidResult(FAILURES['unknown-apartment']);
  }

  const voting = await findVotingById(votingId);
  if (!voting) return notFoundResult(NOT_FOUND);
  if (!isEditableStatus(voting.status)) return invalidResult(NOT_DRAFT);

  const answers = parseAnswers(
    rawAnswers,
    voting.questions.map((question) => question.id),
    voteChoices(voting.allowAbstain)
  );
  if (!answers.ok) return invalidResult(answers.message);

  const result = await addMeetingBallot({
    votingId,
    readAt: voting.updatedAt,
    hoaId: voting.hoa.id,
    apartmentId,
    answers: answers.value,
  });
  if (!result.ok) return invalidResult(FAILURES[result.reason]);

  const { ballotId } = result;
  logger.info({ adminId, votingId, ballotId }, 'Meeting ballot entered');

  return { ok: true, data: { id: ballotId } };
}

export async function removeMeetingBallotUseCase(
  adminId: string,
  votingId: unknown,
  ballotId: unknown
): Promise<UseCaseResult<{ id: string }>> {
  if (
    typeof votingId !== 'string' ||
    typeof ballotId !== 'string' ||
    !(await deleteMeetingBallot(votingId, ballotId))
  ) {
    return notFoundResult(NO_BALLOT);
  }

  logger.info({ adminId, votingId, ballotId }, 'Meeting ballot removed');

  return { ok: true, data: { id: ballotId } };
}
