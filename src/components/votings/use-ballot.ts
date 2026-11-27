'use client';

import { useState } from 'react';

import {
  confirmVoteAction,
  requestVoteConfirmationAction,
} from '@/actions/voting/tenant-votings';
import { type VoteAnswers, VoteChoice } from '@/lib/voting/types/voting';

export type BallotStage = 'answer' | 'code' | 'done';

const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

export function useBallot(votingId: string, questionIds: string[]) {
  const [stage, setStage] = useState<BallotStage>('answer');
  const [answers, setAnswers] = useState<Partial<VoteAnswers>>({});
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [castCount, setCastCount] = useState(0);

  const isComplete = questionIds.every((id) => answers[id] !== undefined);

  function choose(questionId: string, choice: VoteChoice) {
    setAnswers((current) => ({ ...current, [questionId]: choice }));
  }

  async function guarded(task: () => Promise<void>) {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await task();
    } catch {
      setError(FAILURE);
    } finally {
      setPending(false);
    }
  }

  function requestCode() {
    return guarded(async () => {
      const result = await requestVoteConfirmationAction({ votingId, answers });

      if (!result.ok) {
        setError(result.error || FAILURE);
        return;
      }

      setCode('');
      setNotice('Wysłaliśmy kod na Twój adres email');
      setStage('code');
    });
  }

  function confirm() {
    return guarded(async () => {
      const result = await confirmVoteAction({ votingId, code });

      if (!result.ok) {
        setError(result.error || FAILURE);
        return;
      }

      setCastCount(result.data.ballots);
      setStage('done');
    });
  }

  function backToAnswers() {
    setError(null);
    setNotice(null);
    setStage('answer');
  }

  return {
    stage,
    answers,
    code,
    setCode,
    pending,
    error,
    notice,
    castCount,
    isComplete,
    choose,
    requestCode,
    confirm,
    backToAnswers,
  } as const;
}
