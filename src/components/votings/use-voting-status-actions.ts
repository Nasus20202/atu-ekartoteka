'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  changeVotingStatusAction,
  deleteVotingAction,
} from '@/actions/voting/admin-votings';
import { useConfirm } from '@/components/providers/confirm-dialog';
import { VOTING_PATHS } from '@/lib/voting/rules/voting-constants';
import type { VotingStatus } from '@/lib/voting/types/voting';

const FAILURE = 'Nie udało się wykonać operacji';

export function useVotingStatusActions(votingId: string) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    options: Parameters<typeof confirm>[0],
    action: () => Promise<{ ok: boolean; error?: string }>,
    onDone: () => void
  ) {
    if (!(await confirm(options))) return;

    setPending(true);
    setError(null);

    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error || FAILURE);
        return;
      }
      onDone();
    } catch {
      setError(FAILURE);
    } finally {
      setPending(false);
    }
  }

  function changeStatus(
    status: VotingStatus,
    options: Parameters<typeof confirm>[0]
  ) {
    return run(
      options,
      () => changeVotingStatusAction({ votingId, status }),
      () => router.refresh()
    );
  }

  function remove() {
    return run(
      {
        title: 'Usunąć głosowanie?',
        description: 'Wersja robocza zostanie usunięta bezpowrotnie.',
        confirmText: 'Usuń',
        variant: 'destructive',
      },
      () => deleteVotingAction({ votingId }),
      () => {
        router.push(VOTING_PATHS.admin);
        router.refresh();
      }
    );
  }

  return { pending, error, changeStatus, remove } as const;
}
