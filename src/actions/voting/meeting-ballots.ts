'use server';

import {
  type ActionResult,
  fromUseCaseResult,
  readInput,
} from '@/actions/action-result';
import { requireAdminAction } from '@/lib/framework/auth/require-action';
import {
  addMeetingBallotUseCase,
  removeMeetingBallotUseCase,
} from '@/lib/voting/use-cases/meeting-ballots';

export async function addMeetingBallotAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized meeting ballot entry attempt'
  );
  if (denied) return denied;

  const { votingId, apartmentId, answers } = readInput(input);

  return fromUseCaseResult(
    await addMeetingBallotUseCase(
      session.user.id,
      votingId,
      apartmentId,
      answers
    )
  );
}

export async function removeMeetingBallotAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized meeting ballot removal attempt'
  );
  if (denied) return denied;

  const { votingId, ballotId } = readInput(input);

  return fromUseCaseResult(
    await removeMeetingBallotUseCase(session.user.id, votingId, ballotId)
  );
}
