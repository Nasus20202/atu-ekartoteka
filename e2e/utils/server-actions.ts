import type { Response } from '@playwright/test';

/** A successful Server Action call: a POST that carries the `Next-Action` header. */
export function isServerActionResponse(response: Response): boolean {
  const request = response.request();

  return (
    request.method() === 'POST' &&
    request.headers()['next-action'] !== undefined &&
    response.status() === 200
  );
}
