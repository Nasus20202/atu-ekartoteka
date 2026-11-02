'use client';

import { useEffect, useState } from 'react';

/** Matches the `slide-out-top` animation duration in `tailwind.config.ts`. */
export const PRESENCE_EXIT_MS = 200;

export type PresenceState = 'open' | 'closed';

interface Presence {
  isMounted: boolean;
  state: PresenceState;
}

/**
 * Keeps a conditionally rendered element mounted until its exit animation
 * finishes. `state` is meant for a `data-state` attribute that selects the
 * enter/exit animation in CSS.
 */
export function usePresence(visible: boolean): Presence {
  const [isMounted, setIsMounted] = useState(visible);

  // Show again without waiting for the effect, so no blank frame is rendered
  if (visible && !isMounted) {
    setIsMounted(true);
  }

  const isLeaving = isMounted && !visible;

  useEffect(() => {
    if (!isLeaving) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsMounted(false);
    }, PRESENCE_EXIT_MS);

    return () => clearTimeout(timeout);
  }, [isLeaving]);

  return { isMounted, state: isLeaving ? 'closed' : 'open' };
}
