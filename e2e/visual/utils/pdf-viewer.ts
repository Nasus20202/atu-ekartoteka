/**
 * Compares the pages of a generated PDF with stored screenshots. The PDF is
 * drawn by pdf.js onto canvases in a viewer page in the same browser context,
 * so each page is a DOM element and screenshots contain no browser chrome.
 * pdf.js and its worker come from node_modules through route handlers.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  type BrowserContext,
  expect,
  type Locator,
  type Page,
  type Route,
} from '@playwright/test';

const VIEWER_ORIGIN = 'http://pdf-viewer.test';
const VIEWER_HTML_PATH = path.join(
  process.cwd(),
  'e2e/visual/utils/pdf-viewer.html'
);
const PDFJS_BUILD_DIR = path.join(
  process.cwd(),
  'node_modules/pdfjs-dist/build'
);
const PDFJS_PATH_PREFIX = '/pdfjs/';
const HTML_CONTENT_TYPE = 'text/html';
const JAVASCRIPT_CONTENT_TYPE = 'text/javascript';
const NOT_FOUND_STATUS = 404;
// Fixed scale keeps canvas sizes, and so the baselines, identical on every run
const RENDER_SCALE = 1.5;
const PAGE_CANVAS_SELECTOR = '#pages canvas';

async function serveViewerFile(route: Route) {
  const { pathname } = new URL(route.request().url());

  if (pathname === '/') {
    return route.fulfill({
      contentType: HTML_CONTENT_TYPE,
      body: await readFile(VIEWER_HTML_PATH),
    });
  }

  if (pathname.startsWith(PDFJS_PATH_PREFIX)) {
    // basename keeps the lookup inside the pdf.js build directory
    const file = path.join(
      PDFJS_BUILD_DIR,
      path.basename(pathname.slice(PDFJS_PATH_PREFIX.length))
    );
    return route.fulfill({
      contentType: JAVASCRIPT_CONTENT_TYPE,
      body: await readFile(file),
    });
  }

  return route.fulfill({ status: NOT_FOUND_STATUS });
}

/** Downloads the file that the button at `trigger` starts. */
export async function downloadBytes(trigger: Locator): Promise<Buffer> {
  const downloadPromise = trigger.page().waitForEvent('download');
  await trigger.click();
  const download = await downloadPromise;

  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function renderPages(viewer: Page, pdf: Buffer) {
  await viewer.waitForFunction(() => 'renderPdf' in window);
  await viewer.evaluate(
    ({ base64, scale }) =>
      (window as unknown as RenderWindow).renderPdf(base64, scale),
    { base64: pdf.toString('base64'), scale: RENDER_SCALE }
  );
}

interface RenderWindow {
  renderPdf(base64: string, scale: number): Promise<number>;
}

/**
 * Renders every page of `pdf` and compares each one with the screenshot
 * `<name>-page-<n>.png`. Returns the number of pages compared. The viewer page
 * is closed even when a comparison fails.
 */
export async function expectPdfPagesToMatch(
  context: BrowserContext,
  pdf: Buffer,
  name: string
): Promise<number> {
  const viewer = await context.newPage();
  try {
    await viewer.route(`${VIEWER_ORIGIN}/**`, serveViewerFile);
    await viewer.goto(`${VIEWER_ORIGIN}/`);
    await renderPages(viewer, pdf);

    const pages = viewer.locator(PAGE_CANVAS_SELECTOR);
    const count = await pages.count();
    for (let index = 0; index < count; index++) {
      await expect(pages.nth(index)).toHaveScreenshot(
        `${name}-page-${index + 1}.png`
      );
    }
    return count;
  } finally {
    await viewer.close();
  }
}
