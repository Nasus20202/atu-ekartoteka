import type { Project } from '@playwright/test';

// The Safari profiles default to 2x and 3x, which software rendering on a CI
// runner cannot keep up with
const WEBKIT_DEVICE_SCALE_FACTOR = 1;

export const webkitUse = (device: Project['use']): Project['use'] => ({
  ...device,
  deviceScaleFactor: WEBKIT_DEVICE_SCALE_FACTOR,
});
