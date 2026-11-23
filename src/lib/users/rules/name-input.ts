export const INVALID_NAME_MESSAGE = 'Nieprawidłowe imię';

/** A name is optional, but when the browser sends one it must be a string. */
export function isNameInputValid(name: unknown): boolean {
  return name === undefined || name === null || typeof name === 'string';
}
