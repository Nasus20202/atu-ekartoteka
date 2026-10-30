import { Children, isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  DocumentPage,
  PdfHeader,
  PdfNoteText,
  SectionTitle,
} from '@/components/pdf/primitives';

type WithChildren = ReactElement<{ children?: React.ReactNode; size?: string }>;

const texts = (element: WithChildren) =>
  Children.toArray(element.props.children)
    .filter(isValidElement)
    .map((child) => (child as WithChildren).props.children);

describe('PDF primitives', () => {
  it('renders the content on an A4 page', () => {
    const page = DocumentPage({ children: 'treść' }) as WithChildren;

    expect(page.props.size).toBe('A4');
    expect(page.props.children).toBe('treść');
  });

  it('renders the header title and optional subtitle', () => {
    expect(
      texts(
        PdfHeader({ title: 'Wpłaty', subtitle: 'Rok 2025' }) as WithChildren
      )
    ).toEqual(['Wpłaty', 'Rok 2025']);
    expect(texts(PdfHeader({ title: 'Wpłaty' }) as WithChildren)).toEqual([
      'Wpłaty',
    ]);
  });

  it('renders a section title', () => {
    const title = SectionTitle({ children: 'Podsumowanie' }) as WithChildren;

    expect(title.props.children).toBe('Podsumowanie');
  });

  it('renders note text unchanged, keeping line breaks', () => {
    const note = PdfNoteText({ children: 'Linia 1\nLinia 2' }) as WithChildren;

    expect(note.props.children).toBe('Linia 1\nLinia 2');
  });
});
