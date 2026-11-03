import { createUserAction, updateUserStatusAction } from '@/actions/users';
import type { NewUserFormData } from '@/components/users/types';
import type { AccountStatus } from '@/lib/types';

export const UPDATE_USER_FAILED_MESSAGE =
  'Nie udało się zaktualizować użytkownika';
export const CREATE_USER_FAILED_MESSAGE = 'Nie udało się utworzyć użytkownika';

/** Resolves to an error message, or null when the action succeeded. */
async function errorOf(
  action: Promise<{ ok: boolean; error?: string }>,
  fallbackError: string
): Promise<string | null> {
  try {
    const result = await action;
    return result.ok ? null : result.error || fallbackError;
  } catch {
    return fallbackError;
  }
}

export function updateUserRequest(payload: {
  userId: string;
  status: AccountStatus;
  apartmentIds?: string[];
}): Promise<string | null> {
  return errorOf(updateUserStatusAction(payload), UPDATE_USER_FAILED_MESSAGE);
}

export function createUserRequest(
  data: NewUserFormData
): Promise<string | null> {
  return errorOf(createUserAction(data), CREATE_USER_FAILED_MESSAGE);
}
