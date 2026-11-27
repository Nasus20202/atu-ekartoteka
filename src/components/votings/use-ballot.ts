'use client';

import { useState } from 'react';

import { requestVoteConfirmationAction } from '@/actions/voting/tenant-votings';
import { type VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

export type BallotStage = 'answer' | 'sent';

const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

export function useBallot(votingId: string, questionIds: string[]) {
  const [stage, setStage] = useState<BallotStage>('answer');
  const [answers, setAnswers] = useState<Partial<VoteAnswers>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isComplete = questionIds.every((id) => answers[id] !== undefined);

  function choose(questionId: string, choice: VoteChoice) {
    setAnswers((current) => ({ ...current, [questionId]: choice }));
  }

  async function sendLink() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const result = await requestVoteConfirmationAction({ votingId, answers });

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
    isComplete,
    choose,
    sendLink,
    backToAnswers,
  } as const;
}
