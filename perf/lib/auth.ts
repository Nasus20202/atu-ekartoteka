import { check, fail } from 'k6';
import http from 'k6/http';

import { BASE_URL, type Credentials, SESSION_COOKIE } from './config.ts';

const loggedIn: Record<string, boolean> = {};

export function login({ email, password }: Credentials) {
  const csrf = http.get(`${BASE_URL}/api/auth/csrf`, {
    tags: { name: 'auth csrf' },
  });
  if (!check(csrf, { 'csrf 200': (r) => r.status === 200 })) return false;
  const csrfToken = String(csrf.json('csrfToken'));

  const res = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    { csrfToken, email, password, callbackUrl: `${BASE_URL}/dashboard` },
    { redirects: 0, tags: { name: 'auth login' } }
  );

  const cookies = http.cookieJar().cookiesForURL(BASE_URL);
  return check(res, {
    'login redirects': (r) => r.status === 302,
    'login sets session cookie': () => Boolean(cookies[SESSION_COOKIE]),
    'login has no error': (r) => !String(r.headers.Location).includes('error'),
  });
}

// k6 keeps module state per VU and `noCookiesReset` keeps its cookie jar, so each VU signs in once.
export function ensureLoggedIn(credentials: Credentials) {
  if (loggedIn[credentials.email]) return;
  if (!login(credentials)) fail(`login failed for ${credentials.email}`);
  loggedIn[credentials.email] = true;
}
