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

export const options = {
  noCookiesReset: true,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: THRESHOLDS,
  scenarios: {
    public: {
      executor: 'constant-arrival-rate',
      exec: 'publicScenario',
      rate: PUBLIC_RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: PUBLIC_RATE,
      maxVUs: PUBLIC_RATE * 2,
    },
    login: {
      executor: 'constant-arrival-rate',
      exec: 'loginScenario',
      rate: LOGIN_RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: LOGIN_RATE * 2,
      maxVUs: LOGIN_RATE * 5,
    },
    user_journey: {
      executor: 'ramping-vus',
      exec: 'userScenario',
      stages: [
        { duration: RAMP_UP, target: USER_VUS },
        { duration: DURATION, target: USER_VUS },
        { duration: RAMP_UP, target: 0 },
      ],
    },
    admin_journey: {
      executor: 'constant-vus',
      exec: 'adminScenario',
      vus: ADMIN_VUS,
      duration: DURATION,
    },
  },
};

export function handleSummary(data) {
  return buildSummary(data);
}
