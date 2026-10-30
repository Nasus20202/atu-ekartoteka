import http from 'k6/http';

import { login } from '../lib/auth.ts';
import { BASE_URL } from '../lib/config.ts';
import { randomTenant } from '../lib/targets.ts';

export function loginScenario() {
  http.cookieJar().clear(BASE_URL);
  login(randomTenant());
}
