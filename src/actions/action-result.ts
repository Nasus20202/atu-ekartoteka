import type { ActionDenied } from '@/lib/framework/auth/require-action';
import type { UseCaseResult } from '@/lib/shared/use-case-result';

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

/** Maps a use case outcome onto the shape a Server Action returns. */
export function fromUseCaseResult<T>(
  result: UseCaseResult<T>
): ActionResult<T> {
  return result.ok
    ? { ok: true, data: result.data }
    : { ok: false, error: result.message, code: result.code };
}
