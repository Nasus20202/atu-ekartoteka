export const UNKNOWN_ERROR_MESSAGE = 'Nieznany błąd';
export const GENERIC_ERROR_MESSAGE = 'Wystąpił błąd';

export function getErrorMessage(
  error: unknown,
  fallback: string = UNKNOWN_ERROR_MESSAGE
): string {
  return error instanceof Error ? error.message : fallback;
}
