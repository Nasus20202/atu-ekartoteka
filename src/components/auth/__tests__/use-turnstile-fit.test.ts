import { describe, expect, it } from 'vitest';

import {
  getTurnstileFit,
  TURNSTILE_HEIGHT,
  TURNSTILE_MIN_WIDTH,
} from '@/components/auth/use-turnstile-fit';

describe('getTurnstileFit', () => {
  it('renders at full size when the slot is wider than the minimum', () => {
    expect(getTurnstileFit(400)).toEqual({
      width: 400,
      scale: 1,
      height: TURNSTILE_HEIGHT,
    });
  });

  it('scales the widget down to the slot width on narrow screens', () => {
    const fit = getTurnstileFit(280);

    expect(fit.width).toBe(TURNSTILE_MIN_WIDTH);
    expect(fit.scale).toBeCloseTo(280 / TURNSTILE_MIN_WIDTH);
    expect(fit.width * fit.scale).toBeCloseTo(280);
    expect(fit.height).toBeCloseTo(TURNSTILE_HEIGHT * fit.scale);
  });

  it('keeps full size until the slot has been measured', () => {
    expect(getTurnstileFit(0)).toEqual({
      width: TURNSTILE_MIN_WIDTH,
      scale: 1,
      height: TURNSTILE_HEIGHT,
    });
  });
});
