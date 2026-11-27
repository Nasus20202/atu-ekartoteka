'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  addMeetingBallotAction,
  removeMeetingBallotAction,
} from '@/actions/voting/meeting-ballots';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { useMeetingApartments } from '@/components/votings/use-meeting-apartments';
import type { MeetingApartmentDto } from '@/lib/voting/dto/meeting-apartment-dto';
import type { VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

const SAVE_FAILED = 'Nie udało się zapisać głosu';
const REMOVE_FAILED = 'Nie udało się usunąć głosu';

/** Entering and removing the ballots cast at a meeting. */
export function useMeetingBallots(votingId: string, questionIds: string[]) {
  const router = useRouter();
  const confirm = useConfirm();
  const apartments = useMeetingApartments(votingId);
  const [apartment, setApartment] = useState<MeetingApartmentDto | null>(null);
  const [answers, setAnswers] = useState<Partial<VoteAnswers>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    failure: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    onDone?: () => void
  ) {
    setPending(true);
    setError(null);

    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error || failure);
        return;
      }
      onDone?.();
      await apartments.refresh();
      router.refresh();
    } catch {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  return {
    apartments,
    apartment,
    answers,
    pending,
    error,
    complete:
      apartment !== null &&
      questionIds.every((id) => answers[id] !== undefined),
    chooseApartment: (id: string) =>
      setApartment(apartments.options.find((o) => o.id === id) ?? null),
    choose: (questionId: string, choice: VoteChoice) =>
      setAnswers((current) => ({ ...current, [questionId]: choice })),
    save: () =>
      run(
        SAVE_FAILED,
        () =>
          addMeetingBallotAction({
            votingId,
            apartmentId: apartment?.id,
            answers,
          }),
        () => {
          setApartment(null);
          setAnswers({});
        }
      ),
    async remove(ballotId: string, label: string) {
      const confirmed = await confirm({
        title: 'Usunąć głos z zebrania?',
        description: `Wpisany głos za lokal ${label} zostanie usunięty.`,
        confirmText: 'Usuń głos',
        variant: 'destructive',
      });
      if (!confirmed) return;

      await run(REMOVE_FAILED, () =>
        removeMeetingBallotAction({ votingId, ballotId })
      );
    },
  } as const;
}
