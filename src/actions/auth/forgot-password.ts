/* eslint-disable local/require-action-auth-guard -- public: requested by a signed-out visitor; the Turnstile check guards it */
'use server';

import { type ActionResult, fromUseCaseResult } from '@/actions/action-result';
import { requestPasswordReset } from '@/lib/auth/use-cases/request-password-reset';

export interface ForgotPasswordInput {
  email: string;
  turnstileToken: string | null;
}

/**
 * Emails a reset link when the account exists. Returns success either way, so
 * the response never reveals whether an email is registered.
 */
export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult<void>> {
  return fromUseCaseResult(
    await requestPasswordReset({
      email: typeof input.email === 'string' ? input.email : '',
      turnstileToken: input.turnstileToken,
    })
  );
}
