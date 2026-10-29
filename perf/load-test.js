import {
  ADMIN_VUS,
  LOAD_STEPS,
  LOGIN_RATE,
  PEAK_HOLD,
  PUBLIC_RATE,
  RAMP_DOWN,
  STEP_HOLD,
  STEP_RAMP,
  USER_VUS,
} from './lib/config.js';
import { buildSummary } from './lib/summary.js';
import { THRESHOLDS } from './lib/thresholds.js';

export { adminScenario } from './scenarios/admin.js';
export { loginScenario } from './scenarios/login.js';
export { publicScenario } from './scenarios/public.js';
export { userScenario } from './scenarios/user.js';

// Every scenario climbs through the same steps to its peak, holds, then drains
function stagesTo(peak) {
  const steps = LOAD_STEPS.flatMap((share) => {
    const target = Math.max(1, Math.round(peak * share));
    return [
      { duration: STEP_RAMP, target },
      { duration: STEP_HOLD, target },
    ];
  });
  return [
    ...steps,
    { duration: PEAK_HOLD, target: peak },
    { duration: RAMP_DOWN, target: 0 },
  ];
}

function arrivalRate(exec, peak, vusPerIteration) {
  return {
    executor: 'ramping-arrival-rate',
    exec,
    startRate: 0,
    timeUnit: '1s',
    stages: stagesTo(peak),
    preAllocatedVUs: peak * vusPerIteration,
    maxVUs: peak * vusPerIteration * 2,
  };
}

function rampingVus(exec, peak) {
  return { executor: 'ramping-vus', exec, startVUs: 0, stages: stagesTo(peak) };
}

export const options = {
  noCookiesReset: true,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: THRESHOLDS,
  scenarios: {
    public: arrivalRate('publicScenario', PUBLIC_RATE, 1),
    login: arrivalRate('loginScenario', LOGIN_RATE, 2),
    user_journey: rampingVus('userScenario', USER_VUS),
    admin_journey: rampingVus('adminScenario', ADMIN_VUS),
  },
};

export function handleSummary(data) {
  return buildSummary(data, {
    'Users (VUs)': USER_VUS,
    'Admins (VUs)': ADMIN_VUS,
    'Public pages (iterations/s)': PUBLIC_RATE,
    'Logins (/s)': LOGIN_RATE,
  });
}
