/* eslint-disable local/require-action-auth-guard -- public: the link in the verification email is opened by a signed-out visitor */
'use server';

import { type ActionResult, fromUseCaseResult } from '@/actions/action-result';
import { verifyEmailToken } from '@/lib/auth/use-cases/verify-email-token';

/** Marks the user's email as verified when the token is valid and unused. */
export async function verifyEmailAction(
  token: string
): Promise<ActionResult<void>> {
  return fromUseCaseResult(
    await verifyEmailToken(typeof token === 'string' ? token : '')
  );
}
