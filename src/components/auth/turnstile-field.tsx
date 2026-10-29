'use client';

import { Turnstile } from '@marsidev/react-turnstile';

import type { TurnstileState } from '@/lib/hooks/use-turnstile';

export function TurnstileField({ turnstile }: { turnstile: TurnstileState }) {
  const { config, ref, setToken } = turnstile;
  if (!config?.enabled || !config.siteKey) return null;

  return (
    <div className="pt-2 flex items-center justify-center">
      <Turnstile
        ref={ref}
        siteKey={config.siteKey}
        onSuccess={(token: string) => setToken(token)}
        onExpire={() => setToken(null)}
        onError={() => setToken(null)}
      />
    </div>
  );
}
