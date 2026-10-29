import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({
  default: ({
    id,
    strategy,
    dangerouslySetInnerHTML,
  }: {
    id: string;
    strategy: string;
    dangerouslySetInnerHTML: { __html: string };
  }) => (
    <script
      id={id}
      data-strategy={strategy}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  ),
}));

import { TrackingScript } from '@/components/providers/tracking-script';

describe('TrackingScript', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders nothing without a tracking script', () => {
    vi.stubEnv('TRACKING_SCRIPT', '');

    const { container } = render(<TrackingScript />);

    expect(container).toBeEmptyDOMElement();
  });

  it('injects the configured script after the page is interactive', () => {
    vi.stubEnv('TRACKING_SCRIPT', 'window.tracked = true;');

    const { container } = render(<TrackingScript />);
    const script = container.querySelector('script#custom-tracking');

    expect(script).toHaveAttribute('data-strategy', 'afterInteractive');
    expect(script?.innerHTML).toBe('window.tracked = true;');
  });
});
