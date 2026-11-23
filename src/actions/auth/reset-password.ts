/* eslint-disable local/require-action-auth-guard -- public: used by a signed-out visitor with an emailed token; the Turnstile check guards it */
'use server';

import { type ActionResult, fromUseCaseResult } from '@/actions/action-result';
import {
  type ResetPasswordRequest,
  resetPasswordWithToken,
} from '@/lib/auth/use-cases/reset-password';

export interface ResetPasswordInput {
  token: string;
  password: string;
  turnstileToken: string | null;
}

/** Sets a new password for the account behind a valid, unused reset token. */
export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult<void>> {
  const request: ResetPasswordRequest = {
    token: typeof input.token === 'string' ? input.token : '',
    password: typeof input.password === 'string' ? input.password : '',
    turnstileToken: input.turnstileToken,
  };

  return fromUseCaseResult(await resetPasswordWithToken(request));
}
