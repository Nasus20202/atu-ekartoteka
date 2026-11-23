import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TrackingScript } from '@/components/providers/tracking-script';

describe('TrackingScript', () => {
  // The component is rendered on the server, so assert on the HTML it ships
  // instead of mounting a script tag in jsdom, which React never executes.
  it('loads the runtime tracking endpoint as a deferred script', () => {
    const markup = renderToStaticMarkup(<TrackingScript />);

    expect(markup).toContain('src="/api/tracking"');
    expect(markup).toContain('defer');
  });

  it('does not inline any configuration into the page', () => {
    const markup = renderToStaticMarkup(<TrackingScript />);

    expect(markup).toBe('<script src="/api/tracking" defer=""></script>');
  });
});
