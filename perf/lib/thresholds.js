// Limits sit at roughly 1.5 times the slowest p95 seen in CI at peak load on the
// production-sized dataset (see perf/seed). Hosted runners vary in CPU speed by
// more than 2x between runs, so a regression such as an endpoint loading every
// row fails the run while a slow runner does not.
const SCENARIO_LIMITS = {
  public: { avg: 20, p95: 70 },
  login: { avg: 130, p95: 300 },
  user_journey: { avg: 230, p95: 540 },
  admin_journey: { avg: 200, p95: 490 },
};

// Slowest endpoints, tracked on their own so one regression is not hidden
// by the scenario average
const ENDPOINT_P95_LIMITS = {
  '/dashboard': 540,
  '/dashboard/charges': 560,
  '/dashboard/payments': 520,
  '/admin/apartments': 410,
  '/api/admin/apartments': 430,
  '/api/admin/users': 370,
  '/api/admin/unassigned-apartments': 550,
  'auth login': 300,
};

export const THRESHOLDS = {
  http_req_failed: ['rate<0.001'],
  checks: ['rate>0.999'],
  // Arrival-rate scenarios must keep their schedule
  dropped_iterations: ['count==0'],
  http_req_duration: ['p(99)<600'],
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
