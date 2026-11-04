import type { Options } from 'k6/options';

// Limits sit at about twice the slowest p95 seen in CI at peak load on the
// production-sized dataset (see perf/seed), rounded up to a round number.
// The headroom absorbs the runner-to-runner CPU differences seen in CI, so a
// regression such as an endpoint loading every row still fails the run.
const SCENARIO_LIMITS: Record<string, { avg: number; p95: number }> = {
  public: { avg: 10, p95: 20 },
  login: { avg: 60, p95: 150 },
  user_journey: { avg: 60, p95: 150 },
  admin_journey: { avg: 80, p95: 200 },
};

// Slowest endpoints, tracked on their own so one regression is not hidden
// by the scenario average
const ENDPOINT_P95_LIMITS: Record<string, number> = {
  '/dashboard': 150,
  '/dashboard/charges': 150,
  '/dashboard/payments': 150,
  '/admin/apartments': 150,
  '/api/admin/apartments': 150,
  '/api/admin/users': 150,
  'admin hoa page': 150,
  'admin hoa apartments': 100,
  'admin apartment page': 150,
  'admin apartment search': 250,
  'payment details': 150,
  '/api/admin/unassigned-apartments': 150,
  'auth login': 150,
};

export const THRESHOLDS: Options['thresholds'] = {
  http_req_failed: ['rate<0.001'],
  checks: ['rate>0.999'],
  // Arrival-rate scenarios must keep their schedule
  dropped_iterations: ['count==0'],
  http_req_duration: ['p(99)<200'],
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
