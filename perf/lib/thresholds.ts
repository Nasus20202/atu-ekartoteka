import type { Options } from 'k6/options';

// Limits are set from the slowest p95 seen in CI at peak load on the
// production-sized dataset (see perf/seed), with about 50% headroom. Shared
// hosted runners vary a lot from run to run, so the headroom absorbs
// runner-to-runner CPU differences while a regression such as an endpoint
// loading every row still fails the run.
const SCENARIO_LIMITS: Record<string, { avg: number; p95: number }> = {
  public: { avg: 25, p95: 75 },
  login: { avg: 150, p95: 375 },
  user_journey: { avg: 300, p95: 675 },
  admin_journey: { avg: 250, p95: 600 },
};

// Slowest endpoints, tracked on their own so one regression is not hidden
// by the scenario average
const ENDPOINT_P95_LIMITS: Record<string, number> = {
  '/dashboard': 750,
  '/dashboard/charges': 675,
  '/dashboard/payments': 675,
  '/admin/apartments': 600,
  '/api/admin/apartments': 675,
  '/api/admin/users': 675,
  'admin hoa page': 525,
  'admin hoa apartments': 525,
  'admin apartment page': 600,
  'admin apartment search': 750,
  'payment details': 675,
  '/api/admin/unassigned-apartments': 650,
  'auth login': 375,
};

export const THRESHOLDS: Options['thresholds'] = {
  http_req_failed: ['rate<0.001'],
  checks: ['rate>0.999'],
  // Arrival-rate scenarios must keep their schedule
  dropped_iterations: ['count==0'],
  http_req_duration: ['p(99)<750'],
  ...Object.fromEntries(
    Object.entries(SCENARIO_LIMITS).map(([scenario, { avg, p95 }]) => [
      `http_req_duration{scenario:${scenario}}`,
      [`avg<${avg}`, `p(95)<${p95}`],
    ])
  ),
  ...Object.fromEntries(
    Object.entries(ENDPOINT_P95_LIMITS).map(([name, p95]) => [
      `http_req_duration{name:${name}}`,
      [`p(95)<${p95}`],
    ])
  ),
};
