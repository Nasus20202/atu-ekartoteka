# Design

## Context

PDFs are built with `@react-pdf/renderer` in the browser. `src/lib/pdf/register-fonts.ts` registers one font file, `/fonts/Roboto-Regular.ttf`, under the family `Roboto`. `src/components/pdf/primitives.tsx` sets `fontFamily: 'Roboto'` on the page, and the components use `styles.bold` for headings and totals. Because no bold face is registered, bold text renders in the regular weight.

The app already uses Geist for the web UI through `next/font/google` (`src/app/layout.tsx`). react-pdf cannot use the web font files, so the PDF needs its own TTF copies in `public/fonts/`.

The visual suite (`e2e/visual/`) runs the production build against a fixed database and a fixed browser clock (`freezeVisualDate` in `e2e/fixtures.ts`). The PDF generation date comes from `toLocalIsoDate(new Date())`, so the fixed clock keeps the printed date stable.

## Goals / Non-Goals

**Goals**

- Every PDF uses Geist Regular and Bold, and no PDF references Roboto.
- The rendered PDFs are checked pixel by pixel against committed baselines.
- The pixel check reuses the Playwright visual-regression setup and adds no image-diff dependency.

**Non-Goals**

- Monospace or tabular figures for numeric cells. Possible follow-up: the Geist Mono family is already bundled for the UI, and react-pdf can register it too. It needs a design decision on which columns change.
- Changing PDF layout, copy, or filenames.

## Decisions

### Font files

Use the static `Geist-Regular.ttf` and `Geist-Bold.ttf` from the npm `geist` package (v1.9.1, SIL Open Font License), copied into `public/fonts/`. Static files are used rather than the variable font, because react-pdf picks a weight from separately registered files.

Register them in one `Font.register` call under the family `Geist`, mapped to weights 400 and 700. The `OFL.txt` license file ships next to them. `Roboto-Regular.ttf` is deleted, since nothing else references it.

`primitives.tsx` sets `fontFamily: 'Geist'`. The bold styles keep `fontWeight: 'bold'`, which now resolves to the registered 700 face.

### Pixel tests rendered in Node

The PDFs are rendered in Node, not in a browser. `pdfjs-dist` 6.5.438 draws each page onto a `@napi-rs/canvas` 1.1.0 canvas, and the page is saved as PNG. The browser is only used to download the PDF from the real button.

Each page is compared with `toMatchSnapshot`, which compares the PNG bytes exactly, with no tolerance. Two runs produce identical bytes, so no tolerance is needed.

Flow for each PDF:

1. Use the `visualPage` fixture (logged in, fixed clock, visual database).
2. Open the page with the PDF button, click it, and read the download bytes.
3. Render every page to PNG with pdf.js and `@napi-rs/canvas`, using a fixed scale and the package's standard font data.
4. Compare each PNG with its snapshot.

Version pins: pdf.js 6.5.438 and `@napi-rs/canvas` 1.1.0 were verified together. Older `@napi-rs/canvas` releases (1.0.12) lack a clipping API that pdf.js 6.x calls, so the two are upgraded together.

### Alternatives considered

- **pdf.js in a Chromium viewer page:** worked, with the HTML in its own file and route-served pdf.js. Dropped in favour of Node rendering, which needs no browser for rendering.
- **Chromium's built-in PDF viewer with a cropped screenshot:** the viewer's toolbar and zoom appear in the screenshot, the URL parameters that hide them were ignored, and the crop breaks when the viewer's layout changes.
- **poppler `pdftoppm`:** fast and deterministic on one machine, but the apt version is not pinned by the repo.
- **pdf.js 6.x with `@napi-rs/canvas`:** the canvas does not implement the clipping API pdf.js 6 uses.
- **node-canvas:** renders blank pages with the sample PDF.

### Test placement

The tests go in `e2e/visual/pdf-documents.spec.ts`, which the visual projects already match. The helpers go in `e2e/visual/utils/pdf-pages.ts`. Only the desktop visual project runs them, because a PDF has no viewport layout.

### Unit tests

`src/lib/pdf/__tests__/register-fonts.test.ts` asserts that Geist Regular (400) and Bold (700) are registered under `Geist` and that nothing registers `Roboto`. `src/components/pdf/__tests__/primitives.test.tsx` asserts that the page style uses `Geist`.

## Risks / Trade-offs

- **Baselines depend on the renderer.** A pdf.js or canvas upgrade can move pixels. Baselines are regenerated with `pnpm test:e2e:visual:update`, and the upgrade is reviewed as a baseline diff.
- **Baselines are platform-specific.** The existing `{platform}` snapshot path handles this. Baselines are generated on Linux, matching the existing visual screenshots.
- **Download bytes are the real output.** The test exercises the production code path, so it catches layout changes as well as font changes.
- **Dates are pinned by the fixed clock.** If the fixed clock is removed, the generation date will break the baselines.

## Migration Plan

1. Add the fonts and register them; remove Roboto.
2. Update the unit tests.
3. Add the pdf.js dev dependency and the visual PDF tests.
4. Generate baselines once with the update script and review the PNGs before committing them.

Rollback is a revert of the change; the baselines and fonts go with it.
