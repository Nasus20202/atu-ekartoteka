import type { NewUserFormData } from '@/app/admin/users/types';
import type { AccountStatus } from '@/lib/types';

export const UPDATE_USER_FAILED_MESSAGE =
  'Nie udało się zaktualizować użytkownika';
export const CREATE_USER_FAILED_MESSAGE = 'Nie udało się utworzyć użytkownika';

/** Sends JSON and resolves to an error message, or null on success. */
async function sendJson(
  url: string,
  method: 'PATCH' | 'POST',
  body: unknown,
  fallbackError: string
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return null;

    const data = await response.json();
    return data.error || fallbackError;
  } catch {
    return fallbackError;
  }
}

export function updateUserRequest(payload: {
  userId: string;
  status: AccountStatus;
  apartmentIds?: string[];
}): Promise<string | null> {
  return sendJson(
    '/api/admin/users',
    'PATCH',
    payload,
    UPDATE_USER_FAILED_MESSAGE
  );
}

export function createUserRequest(
  data: NewUserFormData
): Promise<string | null> {
  return sendJson(
    '/api/admin/users/create',
    'POST',
    data,
    CREATE_USER_FAILED_MESSAGE
  );
}
