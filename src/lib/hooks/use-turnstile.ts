'use client';

import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useCallback, useRef, useState } from 'react';

import { useTurnstileConfig } from '@/lib/hooks/use-turnstile-config';

/** Turnstile config, the solved token and a way to reset the widget. */
export function useTurnstile() {
  const config = useTurnstileConfig();
  const [token, setToken] = useState<string | null>(null);
  const ref = useRef<TurnstileInstance>(null);

  const reset = useCallback(() => {
    setToken(null);
    ref.current?.reset();
  }, []);

  return {
    config,
    token,
    setToken,
    ref,
    reset,
    /** True while an enabled challenge is still unsolved. */
    isPending: Boolean(config?.enabled && !token),
  };
}

export type TurnstileState = ReturnType<typeof useTurnstile>;
