import { sleep } from 'k6';

import { ensureLoggedIn } from '../lib/auth.ts';
import { ADMIN, THINK_TIME_SECONDS } from '../lib/config.ts';
import { getJson, getPage } from '../lib/requests.ts';
import {
  hoaIdOfApartment,
  randomApartmentId,
  randomApartmentsPage,
  randomHoaId,
  randomOwnerSearch,
  randomUnassignedHoasPage,
} from '../lib/targets.ts';

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
  getJson('/api/admin/users?page=1&limit=50', '/api/admin/users');
  getJson(
    `/api/admin/unassigned-apartments?page=${randomUnassignedHoasPage()}`,
    '/api/admin/unassigned-apartments'
  );
  browseRandomHoa();
  getJson(
    `/api/admin/apartments?search=${encodeURIComponent(randomOwnerSearch())}`,
    'admin apartment search'
  );
}

// The pages load their first data on the server, so the page requests carry the
// query cost; the JSON APIs are what search and scrolling call afterwards
function browseRandomHoa() {
  const hoaId = randomHoaId();
  getPage(`/admin/apartments/${hoaId}`, 'admin hoa page');
  getJson(
    `/api/admin/apartments?hoaId=${hoaId}&page=1&limit=20`,
    'admin hoa apartments'
  );
  getJson(`/api/admin/hoa/${hoaId}/financial-summary`, 'admin hoa summary');

  const apartmentId = randomApartmentId();
  getPage(
    `/admin/apartments/${hoaIdOfApartment(apartmentId)}/${apartmentId}`,
    'admin apartment page'
  );
}
