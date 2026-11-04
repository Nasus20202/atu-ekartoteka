import type { Options } from 'k6/options';

// Limits are set from the slowest p95 seen in CI at peak load on the
// production-sized dataset (see perf/seed), rounded to round numbers and kept
// below the previous calibration (v0.8.12). Shared hosted runners vary, so the
// headroom absorbs runner-to-runner CPU differences while a regression such as
// an endpoint loading every row still fails the run.
const SCENARIO_LIMITS: Record<string, { avg: number; p95: number }> = {
  public: { avg: 15, p95: 50 },
  login: { avg: 100, p95: 250 },
  user_journey: { avg: 200, p95: 450 },
  admin_journey: { avg: 150, p95: 400 },
};

// Slowest endpoints, tracked on their own so one regression is not hidden
// by the scenario average
const ENDPOINT_P95_LIMITS: Record<string, number> = {
  '/dashboard': 500,
  '/dashboard/charges': 450,
  '/dashboard/payments': 450,
  '/admin/apartments': 400,
  '/api/admin/apartments': 450,
  '/api/admin/users': 450,
  'admin hoa page': 350,
  'admin hoa apartments': 350,
  'admin apartment page': 400,
  'admin apartment search': 500,
  'payment details': 450,
  '/api/admin/unassigned-apartments': 400,
  'auth login': 250,
};

export const THRESHOLDS: Options['thresholds'] = {
  http_req_failed: ['rate<0.001'],
  checks: ['rate>0.999'],
  // Arrival-rate scenarios must keep their schedule
  dropped_iterations: ['count==0'],
  http_req_duration: ['p(99)<500'],
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
