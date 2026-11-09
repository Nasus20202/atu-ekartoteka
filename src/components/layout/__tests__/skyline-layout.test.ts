import { describe, expect, it } from 'vitest';

import {
  buildSkyline,
  SKYLINE_HEIGHT,
  SKYLINE_LAYERS,
  SKYLINE_WIDTH,
  windowsPath,
} from '@/components/layout/skyline-layout';

describe('buildSkyline', () => {
  it('is deterministic', () => {
    expect(buildSkyline(SKYLINE_LAYERS.back)).toEqual(
      buildSkyline(SKYLINE_LAYERS.back)
    );
  });

  it('covers the whole width with buildings standing on the ground', () => {
    const buildings = buildSkyline(SKYLINE_LAYERS.front);
    const last = buildings[buildings.length - 1];

    expect(buildings[0].x).toBeLessThan(0);
    expect(last.x + last.width).toBeGreaterThan(SKYLINE_WIDTH);
    for (const building of buildings) {
      expect(building.y + building.height).toBe(SKYLINE_HEIGHT);
      expect(building.height).toBeGreaterThanOrEqual(
        SKYLINE_LAYERS.front.minHeight
      );
      expect(building.height).toBeLessThanOrEqual(
        SKYLINE_LAYERS.front.maxHeight
      );
    }
  });

  it('keeps the back layer taller than the front layer', () => {
    expect(SKYLINE_LAYERS.back.maxHeight).toBeGreaterThan(
      SKYLINE_LAYERS.front.maxHeight
    );
  });
});

describe('windowsPath', () => {
  it('draws windows for buildings and nothing for none', () => {
    expect(windowsPath([])).toBe('');
    expect(windowsPath(buildSkyline(SKYLINE_LAYERS.back))).toMatch(/^M/);
  });

  it('skips buildings too narrow for a window', () => {
    expect(windowsPath([{ x: 0, y: 300, width: 20, height: 120 }])).toBe('');
  });
});
