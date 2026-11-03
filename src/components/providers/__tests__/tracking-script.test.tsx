import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({
  // A real <script> element triggers React 19's "scripts are never executed"
  // warning; the props are what this test verifies.
  default: ({
    id,
    strategy,
    dangerouslySetInnerHTML,
  }: {
    id: string;
    strategy: string;
    dangerouslySetInnerHTML: { __html: string };
  }) => (
    <div
      id={id}
      data-strategy={strategy}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  ),
}));

vi.mock('next/server', () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

import { TrackingScript } from '@/components/providers/tracking-script';

describe('TrackingScript', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders nothing without a tracking script', async () => {
    vi.stubEnv('TRACKING_SCRIPT', '');

    const { container } = render(await TrackingScript());

    expect(container).toBeEmptyDOMElement();
  });

  it('injects the configured script after the page is interactive', async () => {
    vi.stubEnv('TRACKING_SCRIPT', 'window.tracked = true;');

    const { container } = render(await TrackingScript());
    const script = container.querySelector('#custom-tracking');

    expect(script).toHaveAttribute('data-strategy', 'afterInteractive');
    expect(script?.innerHTML).toBe('window.tracked = true;');
  });
});
