import { describe, expect, it } from 'vitest';

import { type ActionResult, unwrapResult } from '@/actions/action-result';

describe('unwrapResult', () => {
  it('returns the data of a successful result', () => {
    const result: ActionResult<number> = { ok: true, data: 42 };

    expect(unwrapResult(result)).toBe(42);
  });

  it('throws the failure message', () => {
    const result: ActionResult<number> = {
      ok: false,
      code: 'invalid',
      error: 'Brak wymaganych pól',
    };

    expect(() => unwrapResult(result)).toThrow('Brak wymaganych pól');
  });
});
