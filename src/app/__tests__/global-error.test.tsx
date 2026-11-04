import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import GlobalError from '@/app/global-error';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('GlobalError', () => {
  it('renders its own document with the Polish message and a retry button', () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error('boom')} reset={vi.fn()} />
    );

    expect(markup).toContain('<html lang="pl">');
    expect(markup).toContain('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    expect(markup).toContain('Spróbuj ponownie</button>');
  });

  it('shows the digest when the error has one', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    const markup = renderToStaticMarkup(
      <GlobalError error={error} reset={vi.fn()} />
    );

    expect(markup).toContain('Kod błędu');
    expect(markup).toContain('abc123');
  });

  it('omits the error code when there is no digest', () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error('boom')} reset={vi.fn()} />
    );

    expect(markup).not.toContain('Kod błędu');
  });
});
