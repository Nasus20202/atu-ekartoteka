import { sleep } from 'k6';

import { ensureLoggedIn } from '../lib/auth.js';
import { THINK_TIME_SECONDS } from '../lib/config.js';
import { getPage } from '../lib/requests.js';
import { apartmentIdOfTenant, tenantForVu } from '../lib/targets.js';

export function userScenario() {
  const tenant = tenantForVu();
  ensureLoggedIn(tenant);
  const pages = [
    ['/dashboard'],
    ['/dashboard/charges'],
    [
      `/dashboard/charges/${apartmentIdOfTenant(tenant.email)}`,
      '/dashboard/charges/:id',
    ],
    ['/dashboard/payments'],
    ['/dashboard/profile'],
  ];
  for (const [path, name] of pages) {
    getPage(path, name);
    sleep(THINK_TIME_SECONDS);
  }
}
