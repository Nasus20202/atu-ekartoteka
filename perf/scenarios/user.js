import { sleep } from 'k6';

import { ensureLoggedIn } from '../lib/auth.js';
import { THINK_TIME_SECONDS, USER } from '../lib/config.js';
import { getPage } from '../lib/requests.js';

const USER_PAGES = [
  '/dashboard',
  '/dashboard/charges',
  '/dashboard/payments',
  '/dashboard/profile',
];

export function userScenario() {
  ensureLoggedIn(USER);
  for (const path of USER_PAGES) {
    getPage(path);
    sleep(THINK_TIME_SECONDS);
  }
}
