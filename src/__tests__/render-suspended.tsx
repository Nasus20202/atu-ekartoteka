import { act, render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Renders UI that may suspend behind a Suspense boundary.
 *
 * React 19 requires the act scope that `render` opens to be awaited when a
 * component suspends inside it, otherwise it logs that the act call was not
 * awaited and can leave the suspended work outside the test.
 */
export async function renderSuspended(ui: ReactElement): Promise<RenderResult> {
  let result!: RenderResult;

  await act(async () => {
    result = render(ui);
  });

  return result;
}
