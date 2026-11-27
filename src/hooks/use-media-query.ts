'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether the viewport matches a CSS media query, updated on resize. The server
 * snapshot is false, so use it only for content that is rendered on the client.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
