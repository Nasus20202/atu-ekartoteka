import exec from 'k6/execution';

import {
  ADMIN_PAGE_SIZE,
  APARTMENT_COUNT,
  HOA_COUNT,
  TENANT_COUNT,
  TENANT_PASSWORD,
  UNASSIGNED_HOAS_PER_PAGE,
} from './config.js';

export function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function tenantCredentials(index) {
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
export function apartmentIdOfTenant(email) {
  const index = Number(email.match(/perf-user-(\d+)@/)[1]);
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
