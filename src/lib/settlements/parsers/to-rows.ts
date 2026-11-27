import type { PdfItem, PdfPage, PdfRow } from '@/lib/settlements/types/pdf';

// The report templates shift the baselines of one printed row by up to 2.8
// units, while separate rows are at least 5.6 units apart
const ROW_TOLERANCE = 4;
// Items closer than this share of the text height are one word
const WORD_GAP_RATIO = 0.15;

function rowText(items: PdfItem[]): string {
  let text = '';
  let end: number | null = null;

  for (const item of items) {
    const touching =
      end !== null && item.x - end < item.height * WORD_GAP_RATIO;
    text += end === null || touching ? item.text : ` ${item.text}`;
    end = item.x + item.width;
  }

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Joins the items of the pages into printed rows, top to bottom. The order of
 * the text inside the file differs between templates, so only positions count.
 */
export function toRows(
  pages: PdfPage[],
  include: (item: PdfItem) => boolean = () => true
): PdfRow[] {
  return pages.flatMap((page) => {
    const sorted = page.items.filter(include).sort((a, b) => a.y - b.y);
    const groups: PdfItem[][] = [];

    for (const item of sorted) {
      const group = groups.at(-1);
      const previous = group?.at(-1);
      if (group && previous && item.y - previous.y <= ROW_TOLERANCE) {
        group.push(item);
      } else {
        groups.push([item]);
      }
    }

    return groups.map((group) => {
      const ordered = [...group].sort((a, b) => a.x - b.x);
      return { page: page.number, x: ordered[0].x, text: rowText(ordered) };
    });
  });
}
