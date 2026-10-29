export const BASE_URL = __ENV.PERF_BASE_URL || 'http://localhost:3000';

// Must match e2e/utils/test-credentials.ts (seeded by e2e/utils/seed-test-data.ts)
export const ADMIN = {
  email: 'admin@e2e-test.com',
  password: 'AdminPassword123!',
};
export const USER = {
  email: 'user@e2e-test.com',
  password: 'UserPassword123!',
};

export const SESSION_COOKIE = 'authjs.session-token';

export const DURATION = __ENV.PERF_DURATION || '2m';
export const RAMP_UP = __ENV.PERF_RAMP_UP || '1m';
export const USER_VUS = Number(__ENV.PERF_USER_VUS || 200);
export const ADMIN_VUS = Number(__ENV.PERF_ADMIN_VUS || 10);
export const PUBLIC_RATE = Number(__ENV.PERF_PUBLIC_RATE || 50);
export const LOGIN_RATE = Number(__ENV.PERF_LOGIN_RATE || 20);

export const THINK_TIME_SECONDS = 1;

export const THRESHOLDS = {
  http_req_failed: ['rate==0'],
  checks: ['rate==1'],
  dropped_iterations: ['count==0'],

  // Total (all scenarios combined)
  http_req_duration: ['avg<300', 'p(95)<1500'],

  // Per scenario
  'http_req_duration{scenario:public}': ['avg<70', 'p(95)<120'],
  'http_req_duration{scenario:login}': ['avg<200', 'p(95)<400'],
  'http_req_duration{scenario:admin_journey}': ['avg<600', 'p(95)<1000'],
  'http_req_duration{scenario:user_journey}': ['avg<600', 'p(95)<1800'],
};
