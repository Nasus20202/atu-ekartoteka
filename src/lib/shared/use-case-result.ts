/** Outcome of a use case; the Server Action layer maps it to what the browser sees. */
export type UseCaseResult<T> = { ok: true; data: T } | UseCaseFailure;

export interface UseCaseFailure {
  ok: false;
  code: 'invalid' | 'not-found' | 'failed';
  message: string;
}

export function invalidResult(message: string): UseCaseFailure {
  return { ok: false, code: 'invalid', message };
}

export function notFoundResult(message: string): UseCaseFailure {
  return { ok: false, code: 'not-found', message };
}

export function failedResult(message: string): UseCaseFailure {
  return { ok: false, code: 'failed', message };
}
