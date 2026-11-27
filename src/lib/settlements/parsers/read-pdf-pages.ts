import { getResolvedPDFJS } from 'unpdf';

import type { PdfItem, PdfPage } from '@/lib/settlements/types/pdf';

// Only errors: missing optional rendering support is irrelevant for text
const PDF_VERBOSITY_ERRORS = 0;

/** Reads the text of every page with its position. Rejects for a broken file. */
export async function readPdfPages(data: Uint8Array): Promise<PdfPage[]> {
  const { getDocument, Util } = await getResolvedPDFJS();
  const loadingTask = getDocument({
    // pdf.js takes ownership of the buffer it is given
    data: new Uint8Array(data),
    verbosity: PDF_VERBOSITY_ERRORS,
  });

  try {
    const document = await loadingTask.promise;
    const pages: PdfPage[] = [];

    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const { transform } = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items: PdfItem[] = [];

      for (const item of content.items) {
        if (!('str' in item) || item.str.trim() === '') continue;
        const [, , , , x, y] = Util.transform(transform, item.transform);
        items.push({
          x,
          y,
          width: item.width,
          height: item.height,
          text: item.str,
        });
      }
      pages.push({ number, items });
    }

    return pages;
  } finally {
    await loadingTask.destroy();
  }
}
