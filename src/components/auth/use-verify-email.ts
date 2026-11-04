'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { unwrapResult } from '@/actions/action-result';
import { verifyEmailAction } from '@/actions/auth/verify-email';
import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
} from '@/lib/utils/error-message';

const REDIRECT_DELAY_MS = 2000;

/** Verifies the email token once on mount and reports progress. */
export function useVerifyEmail(token: string | null) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyToken() {
      if (!token) {
        return;
      }

      try {
        unwrapResult(await verifyEmailAction(token));

        if (!cancelled) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, REDIRECT_DELAY_MS);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, GENERIC_ERROR_MESSAGE));
        }
      } finally {
        if (!cancelled) {
          setVerifying(false);
        }
      }
    }

    void verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return { verifying, error, success };
}
