/**
 * Shared options of every client query: the data is revalidated on mount and
 * after a mutation, not on window focus or reconnect, and a failure is shown
 * to the user instead of being retried in the background.
 */
export const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
} as const;
