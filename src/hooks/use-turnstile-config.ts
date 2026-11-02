'use client';

import { useEffect, useState } from 'react';

import type { TurnstileConfig } from '@/lib/types/turnstile';

const TURNSTILE_CONFIG_URL = '/api/config/turnstile';
const DISABLED_TURNSTILE: TurnstileConfig = { siteKey: null, enabled: false };

/** Loads the Turnstile config; null while loading, disabled on failure. */
export function useTurnstileConfig(): TurnstileConfig | null {
  const [config, setConfig] = useState<TurnstileConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(TURNSTILE_CONFIG_URL)
      .then((response) => response.json())
      .then((loaded: TurnstileConfig) => {
        if (!cancelled) setConfig(loaded);
      })
      .catch(() => {
        if (!cancelled) setConfig(DISABLED_TURNSTILE);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
