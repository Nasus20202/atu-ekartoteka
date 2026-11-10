const DEFAULT_APP_URL = 'http://localhost:3000';

/** Absolute URL of a page of the application, for links inside e-mails. */
export function appUrl(path: string): string {
  return `${process.env.APP_URL || DEFAULT_APP_URL}${path}`;
}
