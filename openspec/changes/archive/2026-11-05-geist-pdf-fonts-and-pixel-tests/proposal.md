# Proposal

## Why

PDF documents are rendered with Roboto Regular only. Bold text (headers, table headings, totals) therefore falls back to the regular weight, so the PDFs look flatter than the rest of the application, which uses Geist. Nothing in the test suite checks what a generated PDF looks like: unit tests inspect component element trees and e2e tests only check that a download starts with the expected filename. A font or layout regression in a PDF can ship unnoticed.

## What Changes

- **BREAKING**: PDF documents (charges, payments, current notices) use the Geist font family in Regular and Bold weights instead of Roboto. The visible typography of every generated PDF changes.
- Remove `public/fonts/Roboto-Regular.ttf`; Roboto is no longer used anywhere.
- Add pixel-level PDF tests: the generated PDFs are rendered to canvas in Chromium with pdf.js and compared against committed baseline screenshots, using the existing Playwright visual-regression setup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pdf-export`: PDFs use Geist Regular and Bold; the font is bundled with the app and the PDF output is covered by pixel regression tests.
- `testing`: the visual regression requirement covers the generated PDF documents in addition to pages and emails.

## Impact

- `src/lib/pdf/register-fonts.ts` registers the Geist family (Regular and Bold) instead of Roboto.
- `src/components/pdf/primitives.tsx` sets the document font to Geist.
- `public/fonts/`: adds `Geist-Regular.ttf` and `Geist-Bold.ttf` (from the `geist` npm package, OFL-licensed); removes `Roboto-Regular.ttf`.
- New dev dependency: `pdfjs-dist` (pinned to a release at least two weeks old), used only inside the Playwright visual tests.
- Visual baselines: new PDF screenshot files under `e2e/visual/__screenshots__/`.
- Existing PDF unit tests that assert the Roboto font name are updated.

## Non-goals

- Monospace or tabular figures for numeric cells. Raised as a possible follow-up; not part of this change.
- Changing PDF layout, content, or filenames.
- Testing PDFs against the real PDF output of every edge case (long text, many pages); the baselines cover the representative fixtures only.
