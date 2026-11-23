'use server';

import {
  type ActionResult,
  fromUseCaseResult,
  readInput,
} from '@/actions/action-result';
import { requireUserAction } from '@/lib/framework/auth/require-action';
import type { UserDto } from '@/lib/users/dto/user-dto';
import { updateProfile } from '@/lib/users/use-cases/update-profile';

export async function updateProfileAction(
  input: unknown
): Promise<ActionResult<UserDto>> {
  const { session, denied } = await requireUserAction();
  if (denied) return denied;

  const { name, currentPassword, newPassword } = readInput(input);

  return fromUseCaseResult(
    await updateProfile(session.user.id, { name, currentPassword, newPassword })
  );
}
