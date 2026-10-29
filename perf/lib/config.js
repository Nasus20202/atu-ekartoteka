export const BASE_URL = __ENV.PERF_BASE_URL || 'http://localhost:3000';

// Must match e2e/utils/test-credentials.ts (seeded by e2e/utils/seed-test-data.ts)
export const ADMIN = {
  email: 'admin@e2e-test.com',
  password: 'AdminPassword123!',
};

// Must match perf/seed/perf-credentials.ts and the sizes in perf/seed/seed-perf-data.ts
export const TENANT_PASSWORD = 'PerfPassword123!';
export const TENANT_COUNT = Number(__ENV.PERF_TENANTS || 1000);
export const APARTMENT_COUNT = Number(__ENV.PERF_APARTMENTS || 10000);
export const HOA_COUNT = Number(__ENV.PERF_HOAS || 100);
export const ADMIN_PAGE_SIZE = 20;
export const UNASSIGNED_HOAS_PER_PAGE = 10;

export const SESSION_COOKIE = 'authjs.session-token';

// Load rises in steps to the peak, holds there, then drains
export const LOAD_STEPS = [0.25, 0.5, 0.75, 1];
export const STEP_RAMP = __ENV.PERF_STEP_RAMP || '10s';
export const STEP_HOLD = __ENV.PERF_STEP_HOLD || '30s';
export const PEAK_HOLD = __ENV.PERF_PEAK_HOLD || '1m';
export const RAMP_DOWN = __ENV.PERF_RAMP_DOWN || '20s';

// Peak load per scenario. The app, Postgres and k6 share one CI runner, so
// the peak stays well below its saturation point: near it, runner-to-runner
// CPU differences tripled the measured latency and the run measured the
// runner instead of the app.
export const USER_VUS = Number(__ENV.PERF_USER_VUS || 50);
export const ADMIN_VUS = Number(__ENV.PERF_ADMIN_VUS || 5);
export const PUBLIC_RATE = Number(__ENV.PERF_PUBLIC_RATE || 20);
// Each login runs bcrypt (cost 10), the most CPU-heavy request
export const LOGIN_RATE = Number(__ENV.PERF_LOGIN_RATE || 5);

export const THINK_TIME_SECONDS = 1;
