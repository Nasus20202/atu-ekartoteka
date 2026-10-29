import {
  ADMIN_VUS,
  DURATION,
  LOGIN_RATE,
  PUBLIC_RATE,
  RAMP_UP,
  THRESHOLDS,
  USER_VUS,
} from './lib/config.js';
import { buildSummary } from './lib/summary.js';

export { adminScenario } from './scenarios/admin.js';
export { loginScenario } from './scenarios/login.js';
export { publicScenario } from './scenarios/public.js';
export { userScenario } from './scenarios/user.js';

// Every scenario follows the same profile: ramp up, plateau, ramp down.
const profile = (target) => [
  { duration: RAMP_UP, target },
  { duration: DURATION, target },
  { duration: RAMP_UP, target: 0 },
];

export const options = {
  noCookiesReset: true,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: THRESHOLDS,
  scenarios: {
    public: {
      executor: 'ramping-arrival-rate',
      exec: 'publicScenario',
      startRate: 0,
      timeUnit: '1s',
      stages: profile(PUBLIC_RATE),
      preAllocatedVUs: PUBLIC_RATE,
      maxVUs: PUBLIC_RATE * 2,
    },
    login: {
      executor: 'ramping-arrival-rate',
      exec: 'loginScenario',
      startRate: 0,
      timeUnit: '1s',
      stages: profile(LOGIN_RATE),
      preAllocatedVUs: LOGIN_RATE * 2,
      maxVUs: LOGIN_RATE * 5,
    },
    user_journey: {
      executor: 'ramping-vus',
      exec: 'userScenario',
      startVUs: 0,
      stages: profile(USER_VUS),
    },
    admin_journey: {
      executor: 'ramping-vus',
      exec: 'adminScenario',
      startVUs: 0,
      stages: profile(ADMIN_VUS),
    },
  },
};

export function handleSummary(data) {
  return buildSummary(data);
}
