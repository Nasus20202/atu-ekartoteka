import { describe, expect, it, vi } from 'vitest';

import { expectNoPersonalData } from '@/lib/logging/testing';

describe('expectNoPersonalData', () => {
  it('passes when no call carries a canary', () => {
    const info = vi.fn();
    info({ userId: 'u1' }, 'ok');

    expect(() =>
      expectNoPersonalData([info], ['canary@example.com'])
    ).not.toThrow();
  });

  it('fails when a canary is in a context object or an error message', () => {
    const warn = vi.fn();
    warn({ email: 'canary@example.com' }, 'x');
    const error = vi.fn();
    error({ error: new Error('canary@example.com') }, 'x');

    expect(() =>
      expectNoPersonalData([warn], ['canary@example.com'])
    ).toThrow();
    expect(() =>
      expectNoPersonalData([error], ['canary@example.com'])
    ).toThrow();
  });
});
