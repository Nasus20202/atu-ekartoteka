import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FIXED_NOW_ENV_FLAG, FIXED_NOW_HEADER } from '@/lib/utils/fixed-now';
import { getRequestNow } from '@/lib/utils/request-now';

const { mockHeaderGet } = vi.hoisted(() => ({ mockHeaderGet: vi.fn() }));

vi.mock('next/headers', () => ({
  headers: async () => ({ get: mockHeaderGet }),
}));

const REAL_NOW = new Date('2026-05-10T10:00:00Z');
const FIXED_NOW = '2024-12-15T12:00:00Z';

describe('getRequestNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(REAL_NOW);
    mockHeaderGet.mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('ignores the header when fixed dates are not allowed', async () => {
    expect(await getRequestNow()).toEqual(REAL_NOW);
    expect(mockHeaderGet).not.toHaveBeenCalled();
  });

  it('returns the header date when fixed dates are allowed', async () => {
    vi.stubEnv(FIXED_NOW_ENV_FLAG, 'true');

    expect(await getRequestNow()).toEqual(new Date(FIXED_NOW));
    expect(mockHeaderGet).toHaveBeenCalledWith(FIXED_NOW_HEADER);
  });

  it('falls back to the real date for an invalid header', async () => {
    vi.stubEnv(FIXED_NOW_ENV_FLAG, 'true');
    mockHeaderGet.mockReturnValue('not-a-date');

    expect(await getRequestNow()).toEqual(REAL_NOW);
  });
});
