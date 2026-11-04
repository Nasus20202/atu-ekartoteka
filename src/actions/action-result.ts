import type { ActionDenied } from '@/lib/auth/require-action';

export type ActionFailure = {
  ok: false;
  error: string;
  code: 'invalid' | 'not-found' | 'failed';
};

/** What a Server Action returns: typed data, or the reason it did nothing. */
export type ActionResult<T> =
  { ok: true; data: T } | ActionDenied | ActionFailure;

export function invalid(error: string): ActionFailure {
  return { ok: false, error, code: 'invalid' };
}

export function failed(error: string): ActionFailure {
  return { ok: false, error, code: 'failed' };
}

export function notFound(error: string): ActionFailure {
  return { ok: false, error, code: 'not-found' };
}

/** The fields of an object input, or an empty object for anything else. */
export function readInput(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)
    : {};
}

/** The data of a successful result; throws the failure message otherwise. */
export function unwrapResult<T>(result: ActionResult<T>): T {
  if (result.ok) {
    return result.data;
  }

  throw new Error(result.error);
}
