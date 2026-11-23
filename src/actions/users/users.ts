'use server';

import {
  type ActionResult,
  fromUseCaseResult,
  readInput,
} from '@/actions/action-result';
import { requireAdminAction } from '@/lib/framework/auth/require-action';
import type { UserDto } from '@/lib/users/dto/user-dto';
import {
  type CreatedUser,
  createUserByAdmin,
} from '@/lib/users/use-cases/create-user-by-admin';
import { changeUserStatus } from '@/lib/users/use-cases/update-user-status';

const asString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export async function updateUserStatusAction(
  input: unknown
): Promise<ActionResult<{ user: UserDto }>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized user update attempt'
  );
  if (denied) return denied;

  const { userId, status, apartmentIds } = readInput(input);

  return fromUseCaseResult(
    await changeUserStatus({
      adminId: session.user.id,
      userId,
      status,
      apartmentIds,
    })
  );
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<CreatedUser>> {
  const { session, denied } = await requireAdminAction(
    'Unauthorized user creation attempt'
  );
  if (denied) return denied;

  const fields = readInput(input);

  return fromUseCaseResult(
    await createUserByAdmin({
      adminId: session.user.id,
      email: asString(fields.email),
      password: asString(fields.password),
      name: fields.name,
      role: fields.role,
      status: fields.status,
    })
  );
}
