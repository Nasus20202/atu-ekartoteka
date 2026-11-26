'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import {
  HOA_ORDER_STORAGE_KEY,
  parseHoaOrder,
} from '@/lib/hoa/rules/hoa-order';

// Used when the browser refuses site storage, so reordering still works
let memoryOrder: string | null | undefined;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  if (memoryOrder !== undefined) return memoryOrder;
  try {
    return window.localStorage.getItem(HOA_ORDER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(HOA_ORDER_STORAGE_KEY);
    else window.localStorage.setItem(HOA_ORDER_STORAGE_KEY, value);
    memoryOrder = undefined;
  } catch {
    memoryOrder = value;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** The admin's own HOA order, kept in this browser's local storage. */
export function useHoaOrder() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const order = useMemo(() => parseHoaOrder(raw), [raw]);

  const setOrder = useCallback((ids: readonly string[]) => {
    writeRaw(JSON.stringify(ids));
  }, []);
  const resetOrder = useCallback(() => writeRaw(null), []);

  return { order, setOrder, resetOrder } as const;
}
