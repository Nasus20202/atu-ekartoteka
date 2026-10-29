import { sleep } from 'k6';

import { ensureLoggedIn } from '../lib/auth.js';
import { ADMIN, THINK_TIME_SECONDS } from '../lib/config.js';
import { getJson, getPage } from '../lib/requests.js';

const ADMIN_PAGES = ['/admin/apartments', '/admin/users', '/admin/import'];
const ADMIN_APIS = [
  '/api/admin/stats',
  '/api/admin/hoa',
  '/api/admin/apartments?page=1&limit=20',
  '/api/admin/users?page=1&limit=50',
  '/api/admin/unassigned-apartments',
];

export function adminScenario() {
  ensureLoggedIn(ADMIN);
  for (const path of ADMIN_PAGES) {
    getPage(path);
    sleep(THINK_TIME_SECONDS);
  }
  for (const path of ADMIN_APIS) getJson(path, path.split('?')[0]);
}
