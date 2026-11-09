import { useSyncExternalStore } from 'react';

type Listener = () => void;

let exiting = false;
const listeners = new Set<Listener>();

function setExiting(value: boolean) {
  if (exiting === value) return;
  exiting = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tells the auth pages that the user signed in and is leaving them. */
export function startAuthExit() {
  setExiting(true);
}

export function resetAuthExit() {
  setExiting(false);
}

export function useAuthExiting() {
  return useSyncExternalStore(
    subscribe,
    () => exiting,
    () => false
  );
}
