/**
 * Runs a task once the response has been sent. The framework edge supplies it
 * (`after` from `next/server`), so use cases stay free of `next` imports.
 */
export type AfterResponse = (task: () => Promise<void>) => void;
