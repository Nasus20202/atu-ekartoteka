import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TRACKING_SCRIPT_SRC,
  TrackingScript,
} from '@/components/providers/tracking-script';

describe('TrackingScript', () => {
  it('loads the runtime tracking endpoint as a deferred script', () => {
    const { container } = render(<TrackingScript />);
    const script = container.querySelector('script');

    expect(script).toHaveAttribute('src', TRACKING_SCRIPT_SRC);
    expect(script).toHaveAttribute('defer');
  });

  it('does not inline any configuration into the page', () => {
    const { container } = render(<TrackingScript />);

    expect(container.querySelector('script')?.textContent).toBe('');
  });
});
