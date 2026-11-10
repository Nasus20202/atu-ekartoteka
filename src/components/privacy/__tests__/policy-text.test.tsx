import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PolicyText } from '@/components/privacy/policy-text';

describe('PolicyText', () => {
  it('renders headings, paragraphs, lists, bold text and links', () => {
    render(
      <PolicyText
        text={[
          '# Tytuł',
          '## Sekcja',
          '### Podsekcja',
          'Zwykły **ważny** tekst z [linkiem](https://example.com).',
          '- punkt',
          '1. krok',
        ].join('\n\n')}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tytuł' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sekcja' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Podsekcja' })
    ).toBeInTheDocument();
    expect(screen.getByText('ważny').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'linkiem' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(screen.getByText('punkt').closest('ul')).not.toBeNull();
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByText('krok').closest('ol')).not.toBeNull();
  });

  it('shows raw HTML as text and executes nothing', () => {
    const { container } = render(
      <PolicyText
        text={'<script>alert(1)</script> <img src=x onerror=alert(1)>'}
      />
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('<script>alert(1)</script>');
  });

  it('turns only safe targets into links', () => {
    render(
      <PolicyText
        text={
          '[a](https://a.pl) [b](http://b.pl) [c](mailto:c@d.pl) [d](javascript:alert(1)) [e](//evil.pl)'
        }
      />
    );

    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(
      screen.getByText(/\[d\]\(javascript:alert\(1\)\)/)
    ).toBeInTheDocument();
  });

  it('opens external links safely and keeps internal links in the tab', () => {
    render(<PolicyText text="[obcy](https://a.pl) [swój](/login)" />);

    expect(screen.getByRole('link', { name: 'obcy' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
    expect(screen.getByRole('link', { name: 'obcy' })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(screen.getByRole('link', { name: 'swój' })).not.toHaveAttribute(
      'target'
    );
  });

  it('highlights placeholders only when asked', () => {
    const text = 'Administrator: [[nazwa]], e-mail [[adres]].';
    const { container, rerender } = render(<PolicyText text={text} />);

    expect(container.querySelectorAll('mark')).toHaveLength(0);

    rerender(<PolicyText text={text} highlightPlaceholders />);

    expect(
      [...container.querySelectorAll('mark')].map((mark) => mark.textContent)
    ).toEqual(['[[nazwa]]', '[[adres]]']);
  });

  it('renders nothing for empty text', () => {
    const { container } = render(<PolicyText text="" />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
