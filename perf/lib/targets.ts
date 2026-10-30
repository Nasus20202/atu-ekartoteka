import exec from 'k6/execution';

import {
  ADMIN_PAGE_SIZE,
  APARTMENT_COUNT,
  type Credentials,
  HOA_COUNT,
  PAYMENT_YEARS,
  TENANT_COUNT,
  TENANT_PASSWORD,
  UNASSIGNED_HOAS_PER_PAGE,
} from './config.ts';

export function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function tenantCredentials(index: number): Credentials {
  return {
    email: `perf-user-${index}@perf-test.com`,
    password: TENANT_PASSWORD,
  };
}

// Each virtual user keeps its own tenant for its whole life
export function tenantForVu() {
  return tenantCredentials(((exec.vu.idInTest - 1) % TENANT_COUNT) + 1);
}

export function randomTenant() {
  return tenantCredentials(randomInt(1, TENANT_COUNT));
}

// The seed gives tenant N the apartment N * stride - stride + 1
export function apartmentIdOfTenant(email: string) {
  const index = Number(/perf-user-(\d+)@/.exec(email)?.[1]);
  const stride = Math.max(1, Math.floor(APARTMENT_COUNT / TENANT_COUNT));
  return `perf-apt-${(index - 1) * stride + 1}`;
}

export function randomApartmentId() {
  return `perf-apt-${randomInt(1, APARTMENT_COUNT)}`;
}

export function randomApartmentsPage() {
  return randomInt(1, Math.ceil(APARTMENT_COUNT / ADMIN_PAGE_SIZE));
}

export function randomUnassignedHoasPage() {
  return randomInt(1, Math.ceil(HOA_COUNT / UNASSIGNED_HOAS_PER_PAGE));
}

export function randomHoaId() {
  return `perf-hoa-${randomInt(1, HOA_COUNT)}`;
}

// The seed spreads apartments evenly over the HOAs in order
export function hoaIdOfApartment(apartmentId: string) {
  const index = Number(apartmentId.replace('perf-apt-', ''));
  const perHoa = Math.max(1, Math.floor(APARTMENT_COUNT / HOA_COUNT));
  return `perf-hoa-${Math.floor((index - 1) / perHoa) + 1}`;
}

// The seed has payments for the current year and the ones before it
export function randomPaymentYear() {
  return new Date().getFullYear() - randomInt(0, PAYMENT_YEARS - 1);
}

export function randomOwnerSearch() {
  return `Perf Owner ${randomInt(1, APARTMENT_COUNT)}`;
}
