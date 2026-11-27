/** Rendering the app's PDF documents in Node and reading their text back. */

import { readFileSync } from 'node:fs';

import { Font, renderToBuffer } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

import { readPdfPages } from '@/lib/settlements/parsers/read-pdf-pages';

// The browser loads the fonts by URL; Node needs their content
const source = (name: string) =>
  `data:font/ttf;base64,${readFileSync(`public/fonts/${name}`).toString('base64')}`;

/** Replaces the font registration module. */
export const nodeFonts = () => ({
  registerPdfFonts: () =>
    Font.register({
      family: 'Geist',
      fonts: [
        { src: source('Geist-Regular.ttf'), fontWeight: 400 },
        { src: source('Geist-Bold.ttf'), fontWeight: 700 },
      ],
    }),
});

export async function pageTexts(document: ReactElement) {
  const pages = await readPdfPages(
    await renderToBuffer(document as Parameters<typeof renderToBuffer>[0])
  );
  return pages.map((page) =>
    page.items
      .map((item) => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
  );
}

export const SUBJECT = {
  apartmentLabel: 'Łąkowa 5/1',
  hoaName: 'Wspólnota Mieszkaniowa Źródlana',
  generatedDate: '2026-11-26',
};
