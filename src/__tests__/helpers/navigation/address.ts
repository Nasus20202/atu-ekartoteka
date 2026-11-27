import { useSyncExternalStore } from 'react';
import { vi } from 'vitest';

const CHANGE = 'test:address';

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

/** `useSearchParams` that reads the address of the test window. */
export function useAddressSearchParams() {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  return new URLSearchParams(search);
}

/**
 * Opens an address and tells `useAddressSearchParams` about later changes made
 * through the history API, as the Next.js router does.
 */
export function openAddress(address: string) {
  const replace = History.prototype.replaceState.bind(window.history);
  replace(null, '', address);
  return vi
    .spyOn(window.history, 'replaceState')
    .mockImplementation((...args) => {
      replace(...args);
      window.dispatchEvent(new Event(CHANGE));
    });
}
