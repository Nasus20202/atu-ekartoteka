'use server';

import { type ActionResult, fromUseCaseResult } from '@/actions/action-result';
import { resendVerificationEmail } from '@/lib/auth/use-cases/resend-verification-email';
import { requireUserAction } from '@/lib/framework/auth/require-action';

export async function resendVerificationAction(): Promise<
  ActionResult<{ message: string }>
> {
  const { session, denied } = await requireUserAction();
  if (denied) return denied;

  return fromUseCaseResult(await resendVerificationEmail(session.user.id));
}
