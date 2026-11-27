import { expect, type Locator } from '@playwright/test';

const HYDRATION_TIMEOUT_MS = 10_000;

/** Prefix of the property React sets on a DOM node it has taken over. */
export const REACT_PROPS_PREFIX = '__reactProps';

/**
 * Waits until React has hydrated an element. Before that a typed value is
 * dropped: the next render puts the empty state back into the field.
 */
export async function waitForHydration(element: Locator) {
  await expect
    .poll(
      () =>
        element.evaluate(
          (node, prefix) =>
            Object.keys(node).some((key) => key.startsWith(prefix)),
          REACT_PROPS_PREFIX
        ),
      { timeout: HYDRATION_TIMEOUT_MS }
    )
    .toBe(true);
}
