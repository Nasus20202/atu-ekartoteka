import { sleep } from 'k6';

import { ensureLoggedIn } from '../lib/auth.ts';
import { THINK_TIME_SECONDS } from '../lib/config.ts';
import { getPage } from '../lib/requests.ts';
import {
  apartmentIdOfTenant,
  randomPaymentYear,
  tenantForVu,
} from '../lib/targets.ts';

export function userScenario() {
  const tenant = tenantForVu();
  ensureLoggedIn(tenant);
  const apartmentId = apartmentIdOfTenant(tenant.email);
  const pages = [
    ['/dashboard'],
    ['/dashboard/charges'],
    [`/dashboard/charges/${apartmentId}`, '/dashboard/charges/:id'],
    ['/dashboard/payments'],
    [
      `/dashboard/payments/${apartmentId}/${randomPaymentYear()}`,
      'payment details',
    ],
    ['/dashboard/profile'],
  ];
  for (const [path, name] of pages) {
    getPage(path, name);
    sleep(THINK_TIME_SECONDS);
  }
}
