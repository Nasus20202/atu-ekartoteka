import { check } from 'k6';
import http from 'k6/http';

import { BASE_URL } from './config.ts';

// Next streams this tag when a page redirects after its shell was already sent,
// which keeps the status at 200
const REDIRECT_MARKER = '__next-page-redirect';

export function getPage(path: string, name = path) {
  const res = http.get(`${BASE_URL}${path}`, {
    redirects: 0,
    tags: { name },
  });
  check(res, {
    [`${name} 200`]: (r) => r.status === 200,
    [`${name} is not a late redirect`]: (r) =>
      !String(r.body).includes(REDIRECT_MARKER),
  });
  return res;
}

export function getJson(path: string, name = path) {
  const res = getPage(path, name);
  check(res, {
    [`${name} is JSON`]: (r) =>
      String(r.headers['Content-Type']).includes('application/json'),
  });
  return res;
}
