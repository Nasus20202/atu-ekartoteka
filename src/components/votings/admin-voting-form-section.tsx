import { notFound } from 'next/navigation';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import type { VotingFormValues } from '@/components/votings/use-voting-form';
import { VotingForm } from '@/components/votings/voting-form';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { findHoas } from '@/lib/hoa/queries/find-hoas';
import { findVotingById } from '@/lib/voting/queries/find-voting-by-id';
import { isEditableStatus } from '@/lib/voting/rules/voting-status';

interface Props {
  votingId?: string;
}

const EMPTY_VALUES: VotingFormValues = {
  hoaId: '',
  title: '',
  description: '',
  endsAt: null,
  questions: [],
};

/** The form for a new voting, or for an existing draft. */
export async function AdminVotingFormSection({ votingId }: Props) {
  await requireAdminAccess();

  const [hoas, voting] = await Promise.all([
    findHoas(''),
    votingId ? findVotingById(votingId) : null,
  ]);

  if (votingId && (!voting || !isEditableStatus(voting.status))) notFound();

  const initial: VotingFormValues = voting
    ? {
        votingId: voting.id,
        hoaId: voting.hoa.id,
        title: voting.title,
        description: voting.description ?? '',
        endsAt: voting.endsAt ? voting.endsAt.toISOString() : null,
        questions: voting.questions.map((question) => question.text),
      }
    : EMPTY_VALUES;

  return (
    <div className={REVEAL_CLASS}>
      <VotingForm
        initial={initial}
        hoas={hoas.map(({ id, name }) => ({ id, name }))}
      />
    </div>
  );
}
