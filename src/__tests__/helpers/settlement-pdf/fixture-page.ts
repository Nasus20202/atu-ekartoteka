import type { PdfRow } from '@/lib/settlements/types/pdf';

/** One printed row of a generated sample printout. */
export interface FixtureRow {
  text: string;
  x?: number;
  size?: number;
}

export type FixturePage = FixtureRow[];

export const FIXTURE_LEFT = 24;
export const FIXTURE_RECIPIENT_X = 148;

export const row = (text: string, x?: number, size?: number): FixtureRow => ({
  text,
  x,
  size,
});

/** The rows as the reader would return them, for parser tests without a PDF. */
export const fixtureRows = (pages: FixturePage[]): PdfRow[] =>
  pages.flatMap((page, index) =>
    page.map(({ text, x = FIXTURE_LEFT }) => ({ page: index + 1, x, text }))
  );
