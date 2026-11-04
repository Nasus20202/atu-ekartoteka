'use client';

import { SWRConfig } from 'swr';

interface SwrScopeProps {
  children: React.ReactNode;
}

/**
 * Gives its subtree an SWR cache that dies with it. A list that starts from
 * data the server just loaded must not be overridden by what an earlier visit
 * left in the shared cache.
 */
export function SwrScope({ children }: SwrScopeProps) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );
}
