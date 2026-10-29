import { sleep } from 'k6';

import { ensureLoggedIn } from '../lib/auth.js';
import { ADMIN, THINK_TIME_SECONDS } from '../lib/config.js';
import { getJson, getPage } from '../lib/requests.js';
import {
  randomApartmentId,
  randomApartmentsPage,
  randomUnassignedHoasPage,
} from '../lib/targets.js';

const ADMIN_PAGES = ['/admin/apartments', '/admin/users', '/admin/import'];

export function adminScenario() {
  ensureLoggedIn(ADMIN);
  for (const path of ADMIN_PAGES) {
    getPage(path);
    sleep(THINK_TIME_SECONDS);
  }
  getJson('/api/admin/stats');
  getJson('/api/admin/hoa');
  getJson(
    `/api/admin/apartments?page=${randomApartmentsPage()}&limit=20`,
    '/api/admin/apartments'
  );
  getJson(
    `/api/admin/apartments/${randomApartmentId()}`,
    '/api/admin/apartments/:id'
  );
  getJson('/api/admin/users?page=1&limit=50', '/api/admin/users');
  getJson(
    `/api/admin/unassigned-apartments?page=${randomUnassignedHoasPage()}`,
    '/api/admin/unassigned-apartments'
  );
}
