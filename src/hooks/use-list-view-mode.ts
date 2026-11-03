'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  LIST_VIEW_COOKIE_MAX_AGE_SECONDS,
  listViewCookieName,
  ListViewMode,
  parseListViewMode,
} from '@/lib/list-view-mode';

export { LIST_VIEW_STORAGE_KEYS, ListViewMode } from '@/lib/list-view-mode';

// Used when the browser refuses site storage, so the switch still works
const memoryFallback = new Map<string, ListViewMode>();
const listeners = new Set<() => void>();

function readMode(storageKey: string): ListViewMode {
  const fallback = memoryFallback.get(storageKey);
  if (fallback) return fallback;
  try {
    return parseListViewMode(window.localStorage.getItem(storageKey));
  } catch {
    return ListViewMode.CARDS;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

// The server reads the same choice from this cookie, so the first paint already
// shows the chosen view instead of the default one
function writeCookie(storageKey: string, mode: ListViewMode) {
  document.cookie = `${listViewCookieName(storageKey)}=${mode}; path=/; max-age=${LIST_VIEW_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function useListViewMode(
  storageKey: string,
  initialMode: ListViewMode = ListViewMode.CARDS
) {
  const mode = useSyncExternalStore(
    subscribe,
    () => readMode(storageKey),
    () => initialMode
  );

  // A choice made before the cookie existed still reaches the server
  useEffect(() => {
    writeCookie(storageKey, mode);
  }, [storageKey, mode]);

  const setMode = useCallback(
    (next: ListViewMode) => {
      try {
        window.localStorage.setItem(storageKey, next);
        memoryFallback.delete(storageKey);
      } catch {
        memoryFallback.set(storageKey, next);
      }
      writeCookie(storageKey, next);
      listeners.forEach((listener) => listener());
    },
    [storageKey]
  );

  return [mode, setMode] as const;
}
