import { check } from 'k6';
import http from 'k6/http';

import { BASE_URL } from './config.ts';

export function getPage(path: string, name = path) {
  const res = http.get(`${BASE_URL}${path}`, {
    redirects: 0,
    tags: { name },
  });
  check(res, { [`${name} 200`]: (r) => r.status === 200 });
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
