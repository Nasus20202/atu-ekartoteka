'use client';

import { useCallback, useSyncExternalStore } from 'react';

export enum ListViewMode {
  CARDS = 'cards',
  TABLE = 'table',
}

const VALID_MODES: readonly string[] = Object.values(ListViewMode);

export const LIST_VIEW_STORAGE_KEYS = {
  apartments: 'atu:list-view:apartments',
  users: 'atu:list-view:users',
} as const;

// Used when the browser refuses site storage, so the switch still works
const memoryFallback = new Map<string, ListViewMode>();
const listeners = new Set<() => void>();

function parseMode(value: string | null): ListViewMode {
  return value && VALID_MODES.includes(value)
    ? (value as ListViewMode)
    : ListViewMode.CARDS;
}

function readMode(storageKey: string): ListViewMode {
  const fallback = memoryFallback.get(storageKey);
  if (fallback) return fallback;
  try {
    return parseMode(window.localStorage.getItem(storageKey));
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

const getServerMode = () => ListViewMode.CARDS;

export function useListViewMode(storageKey: string) {
  const mode = useSyncExternalStore(
    subscribe,
    () => readMode(storageKey),
    getServerMode
  );

  const setMode = useCallback(
    (next: ListViewMode) => {
      try {
        window.localStorage.setItem(storageKey, next);
        memoryFallback.delete(storageKey);
      } catch {
        memoryFallback.set(storageKey, next);
      }
      listeners.forEach((listener) => listener());
    },
    [storageKey]
  );

  return [mode, setMode] as const;
}
