'use server';

import {
  type ActionResult,
  fromUseCaseResult,
  readInput,
} from '@/actions/action-result';
import { requireAdminAction } from '@/lib/framework/auth/require-action';
import type { VotingStatus } from '@/lib/voting/types/voting';
import {
  changeVotingStatusUseCase,
  createVotingUseCase,
  deleteVotingUseCase,
  updateVotingUseCase,
} from '@/lib/voting/use-cases/manage-voting';
import {
  notifyVoters,
  type NotifyVotersResult,
} from '@/lib/voting/use-cases/notify-voters';

export async function createVotingAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized voting creation attempt'
  );
  if (denied) return denied;

  return fromUseCaseResult(await createVotingUseCase(session.user.id, input));
}

export async function updateVotingAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized voting update attempt'
  );
  if (denied) return denied;

  const { votingId, ...voting } = readInput(input);

  return fromUseCaseResult(
    await updateVotingUseCase(session.user.id, votingId, voting)
  );
}

export async function changeVotingStatusAction(
  input: unknown
): Promise<ActionResult<{ status: VotingStatus }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized voting status change attempt'
  );
  if (denied) return denied;

  const { votingId, status } = readInput(input);

  return fromUseCaseResult(
    await changeVotingStatusUseCase(session.user.id, votingId, status)
  );
}

export async function deleteVotingAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized voting deletion attempt'
  );
  if (denied) return denied;

  const { votingId } = readInput(input);

  return fromUseCaseResult(
    await deleteVotingUseCase(session.user.id, votingId)
  );
}

export async function notifyVotersAction(
  input: unknown
): Promise<ActionResult<NotifyVotersResult>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized voting notification attempt'
  );
  if (denied) return denied;

  const { votingId, userIds } = readInput(input);

  return fromUseCaseResult(
    await notifyVoters(session.user.id, votingId, userIds)
  );
}
