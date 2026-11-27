'use client';

import { useState } from 'react';

import { requestVoteConfirmationAction } from '@/actions/voting/tenant-votings';
import { type VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

export type BallotStage = 'answer' | 'sent';

const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

/** What is picked so far, by apartment id. */
export type DraftAnswers = Record<string, Partial<VoteAnswers>>;
export type ApartmentProgress = 'empty' | 'partial' | 'complete';

export function useBallot(
  votingId: string,
  apartmentIds: string[],
  questionIds: string[]
) {
  const [stage, setStage] = useState<BallotStage>('answer');
  const [answers, setAnswers] = useState<DraftAnswers>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function progress(apartmentId: string): ApartmentProgress {
    const picked = answers[apartmentId] ?? {};
    if (questionIds.every((id) => picked[id] !== undefined)) return 'complete';
    return Object.keys(picked).length > 0 ? 'partial' : 'empty';
  }

  const complete = apartmentIds.filter((id) => progress(id) === 'complete');
  // An unfinished apartment would be left out without the voter noticing
  const canSubmit =
    complete.length > 0 &&
    apartmentIds.every((id) => progress(id) !== 'partial');

  function choose(apartmentId: string, questionId: string, choice: VoteChoice) {
    setAnswers((current) => ({
      ...current,
      [apartmentId]: { ...current[apartmentId], [questionId]: choice },
    }));
  }

  function clear(apartmentId: string) {
    setAnswers((current) => ({ ...current, [apartmentId]: {} }));
  }

  async function sendLink() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const result = await requestVoteConfirmationAction({
        votingId,
        answers: Object.fromEntries(complete.map((id) => [id, answers[id]])),
      });

      if (!result.ok) {
        setError(result.error || FAILURE);
        return;
      }

      setNotice('Wysłaliśmy link potwierdzający na Twój adres email');
      setStage('sent');
    } catch {
      setError(FAILURE);
    } finally {
      setPending(false);
    }
  }

  function backToAnswers() {
    setError(null);
    setNotice(null);
    setStage('answer');
  }

  return {
    stage,
    answers,
    pending,
    error,
    notice,
    progress,
    canSubmit,
    choose,
    clear,
    sendLink,
    backToAnswers,
  } as const;
}
