// Limits sit at roughly three times the p95 measured in CI at peak load:
// runners differ in CPU speed, so a regression fails the run while a slower
// runner does not.
const SCENARIO_LIMITS = {
  public: { avg: 10, p95: 20 },
  login: { avg: 100, p95: 200 },
  user_journey: { avg: 50, p95: 120 },
  admin_journey: { avg: 50, p95: 100 },
};

// Slowest endpoints, tracked on their own so one regression is not hidden
// by the scenario average
const ENDPOINT_P95_LIMITS = {
  '/dashboard': 120,
  '/dashboard/charges': 120,
  '/dashboard/payments': 120,
  '/admin/apartments': 120,
  '/api/admin/apartments': 100,
  '/api/admin/users': 120,
  '/api/admin/unassigned-apartments': 100,
  'auth login': 200,
};

export const THRESHOLDS = {
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
