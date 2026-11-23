/* eslint-disable local/require-action-auth-guard -- public: runs before the user has an account; the Turnstile check guards it */
'use server';

import { type ActionResult, fromUseCaseResult } from '@/actions/action-result';
import {
  registerAccount,
  type RegisterAccountInput,
  type RegisterData,
} from '@/lib/auth/use-cases/register-account';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  isFirstAdmin: boolean;
  turnstileToken: string | null;
}

export type { RegisterData };

/** Creates an account; the first admin or a pending tenant with a verification email. */
export async function registerAction(
  input: RegisterInput
): Promise<ActionResult<RegisterData>> {
  const account: RegisterAccountInput = {
    email: typeof input.email === 'string' ? input.email : '',
    password: typeof input.password === 'string' ? input.password : '',
    name: typeof input.name === 'string' ? input.name : '',
    isFirstAdmin: input.isFirstAdmin === true,
    turnstileToken: input.turnstileToken,
  };

  return fromUseCaseResult(await registerAccount(account));
}
