import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  resetAuthExit,
  startAuthExit,
  useAuthExiting,
} from '@/components/layout/auth-exit';

describe('auth exit', () => {
  afterEach(() => act(() => resetAuthExit()));

  it('is not exiting by default', () => {
    expect(renderHook(() => useAuthExiting()).result.current).toBe(false);
  });

  it('tells subscribers when the user leaves and when it is reset', () => {
    const { result } = renderHook(() => useAuthExiting());

    act(() => startAuthExit());
    expect(result.current).toBe(true);

    act(() => resetAuthExit());
    expect(result.current).toBe(false);
  });
});
