import http from 'k6/http';

import { login } from '../lib/auth.js';
import { BASE_URL, USER } from '../lib/config.js';

export function loginScenario() {
  http.cookieJar().clear(BASE_URL);
  login(USER);
}
