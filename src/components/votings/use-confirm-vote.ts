'use client';

import { useState } from 'react';

import { confirmVoteAction } from '@/actions/voting/tenant-votings';

const FAILURE = 'Coś poszło nie tak. Spróbuj ponownie';

export function useConfirmVote(token: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [castCount, setCastCount] = useState<number | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);

    try {
      const result = await confirmVoteAction({ token });

      if (!result.ok) {
        setError(result.error || FAILURE);
        return;
      }

      setCastCount(result.data.ballots);
    } catch {
      setError(FAILURE);
    } finally {
      setPending(false);
    }
  }

  return { pending, error, castCount, confirm } as const;
}
