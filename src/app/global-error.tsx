'use client';

import { useEffect } from 'react';

import { logger } from '@/lib/logger';
import {
  formatDocumentTitle,
  PAGE_TITLES,
} from '@/lib/metadata/document-title';

const PAGE_TITLE = PAGE_TITLES.appError;

/**
 * Last-resort boundary for failures in the root layout. The layout's CSS and
 * providers may be missing here, so the page uses inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ error, digest: error.digest }, 'Root layout error');
  }, [error]);

  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <title>{formatDocumentTitle(PAGE_TITLE)}</title>
        <main>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{PAGE_TITLE}</h1>
          <p>Wystąpił nieoczekiwany błąd. Spróbuj ponownie.</p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem' }}>
              Kod błędu: <code>{error.digest}</code>
            </p>
          )}
          <button type="button" onClick={() => reset()}>
            Spróbuj ponownie
          </button>
        </main>
      </body>
    </html>
  );
}
