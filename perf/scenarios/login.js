import http from 'k6/http';

import { login } from '../lib/auth.js';
import { BASE_URL } from '../lib/config.js';
import { randomTenant } from '../lib/targets.js';

export function loginScenario() {
  http.cookieJar().clear(BASE_URL);
  login(randomTenant());
}
