import { describe, expect, it } from 'vitest';

import { parseInline, parseMarkdown } from '@/lib/privacy/markdown';

describe('parseMarkdown', () => {
  it('parses headings of level 1 to 3', () => {
    expect(parseMarkdown('# A\n## B\n### C')).toEqual([
      { kind: 'heading', level: 1, content: [{ kind: 'text', text: 'A' }] },
      { kind: 'heading', level: 2, content: [{ kind: 'text', text: 'B' }] },
      { kind: 'heading', level: 3, content: [{ kind: 'text', text: 'C' }] },
    ]);
  });

  it('does not treat #### or a hash without a space as a heading', () => {
    expect(parseMarkdown('#### D')[0].kind).toBe('paragraph');
    expect(parseMarkdown('#tag')[0].kind).toBe('paragraph');
  });

  it('joins consecutive lines into one paragraph and splits on blank lines', () => {
    expect(parseMarkdown('Pierwsza\ndruga\n\nTrzecia')).toEqual([
      {
        kind: 'paragraph',
        content: [{ kind: 'text', text: 'Pierwsza druga' }],
      },
      { kind: 'paragraph', content: [{ kind: 'text', text: 'Trzecia' }] },
    ]);
  });

  it('parses bulleted lists with - and *', () => {
    const [list] = parseMarkdown('- jeden\n* dwa');

    expect(list).toMatchObject({ kind: 'list', ordered: false });
    expect(list.kind === 'list' && list.items).toHaveLength(2);
  });

  it('parses numbered lists', () => {
    const [list] = parseMarkdown('1. a\n2. b\n3. c');

    expect(list).toMatchObject({ kind: 'list', ordered: true });
    expect(list.kind === 'list' && list.items).toHaveLength(3);
  });

  it('starts a new list after a blank line or a change of kind', () => {
    expect(parseMarkdown('- a\n\n- b').map((block) => block.kind)).toEqual([
      'list',
      'list',
    ]);
    expect(parseMarkdown('- a\n1. b').map((block) => block.kind)).toEqual([
      'list',
      'list',
    ]);
  });

  it('ends a list at the next paragraph line', () => {
    expect(parseMarkdown('- a\ntekst').map((block) => block.kind)).toEqual([
      'list',
      'paragraph',
    ]);
  });

  it('handles CRLF line endings and empty input', () => {
    expect(parseMarkdown('# A\r\n\r\nB')).toHaveLength(2);
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('  \n\n ')).toEqual([]);
  });

  it('keeps raw HTML as text', () => {
    expect(parseMarkdown('<script>alert(1)</script>')).toEqual([
      {
        kind: 'paragraph',
        content: [{ kind: 'text', text: '<script>alert(1)</script>' }],
      },
    ]);
  });
});

describe('parseInline', () => {
  it('parses bold text between plain text', () => {
    expect(parseInline('a **b** c')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'bold', text: 'b' },
      { kind: 'text', text: ' c' },
    ]);
  });

  it.each(['https://example.com/a', 'http://example.com', 'mailto:a@b.pl'])(
    'turns %s into an external link',
    (href) => {
      expect(parseInline(`[tekst](${href})`)).toEqual([
        { kind: 'link', text: 'tekst', href, external: true },
      ]);
    }
  );

  it('turns a single-slash path into an internal link', () => {
    expect(parseInline('[a](/privacy)')).toEqual([
      { kind: 'link', text: 'a', href: '/privacy', external: false },
    ]);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,x',
    '//evil.example',
    '/\\evil.example',
    'relative/path',
    'ftp://x.pl',
  ])('keeps a link to %s as plain text', (href) => {
    const source = `[klik](${href})`;

    expect(parseInline(source)).toEqual([{ kind: 'text', text: source }]);
  });

  it('keeps placeholders and single brackets as text', () => {
    expect(parseInline('[[nazwa]] i [a]')).toEqual([
      { kind: 'text', text: '[[nazwa]] i [a]' },
    ]);
  });

  it('does not nest: asterisks inside text stay literal', () => {
    expect(parseInline('2 * 3 = 6')).toEqual([
      { kind: 'text', text: '2 * 3 = 6' },
    ]);
  });
});
