/**
 * Renders the pages of a generated PDF to PNG images in Node, with pdf.js and
 * a native canvas. Rendering needs no browser, so each page can be compared
 * byte for byte with a stored snapshot.
 */

import path from 'node:path';

import { createCanvas } from '@napi-rs/canvas';
import type { Locator } from '@playwright/test';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Fixed scale keeps image sizes, and so the baselines, identical on every run
const RENDER_SCALE = 1.5;
// Standard font outlines, so non-embedded fonts render the same on every run
const STANDARD_FONT_DATA_URL = path.join(
  process.cwd(),
  'node_modules/pdfjs-dist/standard_fonts/'
);

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

/** Renders every page of `pdf` to a PNG buffer, in page order. */
export async function renderPdfPages(pdf: Buffer): Promise<Buffer[]> {
  const document = await pdfjs.getDocument({
    data: new Uint8Array(pdf),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;
  const images: Buffer[] = [];

  for (let number = 1; number <= document.numPages; number++) {
    const page = await document.getPage(number);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = createCanvas(
      Math.floor(viewport.width),
      Math.floor(viewport.height)
    );

    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
    }).promise;
    images.push(canvas.toBuffer('image/png'));
  }

  return images;
}
