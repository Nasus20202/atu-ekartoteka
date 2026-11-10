export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'link'; text: string; href: string; external: boolean };

export type HeadingLevel = 1 | 2 | 3;

export type Block =
  | { kind: 'heading'; level: HeadingLevel; content: InlineNode[] }
  | { kind: 'paragraph'; content: InlineNode[] }
  | { kind: 'list'; ordered: boolean; items: InlineNode[][] };

const HEADING = /^(#{1,3})\s+(.+)$/;
const BULLET = /^[-*]\s+(.+)$/;
const NUMBERED = /^\d+\.\s+(.+)$/;
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const EXTERNAL_HREF = /^(https?:|mailto:)/i;
// A single leading slash: `//host` and `/\host` leave the site.
const LOCAL_HREF = /^\/(?![/\\])/;

function isSafeHref(href: string): boolean {
  return EXTERNAL_HREF.test(href) || LOCAL_HREF.test(href);
}

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;

  const pushText = (text: string) => {
    if (!text) return;
    const last = nodes.at(-1);
    if (last?.kind === 'text') last.text += text;
    else nodes.push({ kind: 'text', text });
  };

  for (const match of source.matchAll(INLINE)) {
    pushText(source.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const [whole, bold, label, href] = match;
    if (bold !== undefined) {
      nodes.push({ kind: 'bold', text: bold });
    } else if (isSafeHref(href)) {
      nodes.push({
        kind: 'link',
        text: label,
        href,
        external: EXTERNAL_HREF.test(href),
      });
    } else {
      pushText(whole);
    }
  }

  pushText(source.slice(cursor));
  return nodes;
}

/** Parses the supported subset: headings 1-3, paragraphs, lists, bold, links. */
export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  // The list that the next list line continues; a blank line or any other
  // block closes it.
  let openList: Extract<Block, { kind: 'list' }> | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({
      kind: 'paragraph',
      content: parseInline(paragraph.join(' ')),
    });
    paragraph = [];
  };

  const addListItem = (ordered: boolean, text: string) => {
    const item = parseInline(text);
    if (openList?.ordered === ordered) {
      openList.items.push(item);
      return;
    }
    openList = { kind: 'list', ordered, items: [item] };
    blocks.push(openList);
  };

  for (const rawLine of source.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);

    if (line === '') {
      flushParagraph();
      openList = null;
    } else if (heading) {
      flushParagraph();
      openList = null;
      blocks.push({
        kind: 'heading',
        level: heading[1].length as HeadingLevel,
        content: parseInline(heading[2]),
      });
    } else if (bullet || numbered) {
      flushParagraph();
      addListItem(Boolean(numbered), (bullet ?? numbered)![1]);
    } else {
      openList = null;
      paragraph.push(line);
    }
  }

  flushParagraph();
  return blocks;
}
