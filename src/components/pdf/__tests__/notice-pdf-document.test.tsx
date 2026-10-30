import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NotificationItem } from '@/components/dashboard/group-notifications';
import type { NoticePdfApartment } from '@/components/pdf/notice-pdf-document';

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="pdf-page">{children}</section>
  ),
  View: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  StyleSheet: { create: (styles: unknown) => styles },
  Font: { register: vi.fn() },
}));

vi.mock('@/lib/pdf/register-fonts', () => ({ registerPdfFonts: vi.fn() }));

const { NoticePdfDocument } =
  await import('@/components/pdf/notice-pdf-document');

function notification(
  id: string,
  description: string,
  totalAmount: string
): NotificationItem {
  return {
    id,
    description,
    quantity: '1',
    unit: 'szt',
    unitPrice: totalAmount,
    totalAmount,
    apartmentNumber: '1',
    apartmentAddress: 'ul. Testowa 1/1',
  };
}

function apartment(
  overrides: Partial<NoticePdfApartment> = {}
): NoticePdfApartment {
  return {
    address: 'ul. Testowa 1/1',
    hoaName: 'Wspólnota Testowa',
    hoaHeader: 'ZAWIADOMIENIE\nO WYSOKOŚCI OPŁAT',
    hoaFooter: 'Konto: 00 0000',
    notifications: [
      notification('n1', 'Zaliczka CO', '100.50'),
      notification('n2', 'Fundusz remontowy', '49.50'),
    ],
    ...overrides,
  };
}

describe('NoticePdfDocument', () => {
  it('renders one page per apartment', () => {
    render(
      <NoticePdfDocument
        apartments={[apartment(), apartment({ address: 'ul. Testowa 1/2' })]}
        generatedDate="2026-10-30"
      />
    );

    const pages = screen.getAllByTestId('pdf-page');
    expect(pages).toHaveLength(2);
    expect(pages[1]).toHaveTextContent('Naliczenia bieżące – ul. Testowa 1/2');
  });

  it('prints the HOA header with its line breaks, items, total and footer', () => {
    render(
      <NoticePdfDocument
        apartments={[apartment()]}
        generatedDate="2026-10-30"
      />
    );

    const page = screen.getByTestId('pdf-page');
    expect(
      screen.getByText(
        (_, el) => el?.textContent === 'ZAWIADOMIENIE\nO WYSOKOŚCI OPŁAT'
      )
    ).toBeInTheDocument();
    expect(page).toHaveTextContent(
      'Wspólnota Testowa | Wygenerowano: 2026-10-30'
    );
    expect(page).toHaveTextContent('Zaliczka CO');
    expect(page).toHaveTextContent('Fundusz remontowy');
    expect(page).toHaveTextContent(/Razem.*150,00\s*zł/);
    expect(page).toHaveTextContent('Konto: 00 0000');
  });

  it('prints the title first, then the HOA header, then the items', () => {
    render(
      <NoticePdfDocument
        apartments={[apartment()]}
        generatedDate="2026-10-30"
      />
    );

    const text = screen.getByTestId('pdf-page').textContent ?? '';
    const title = text.indexOf('Naliczenia bieżące');
    const header = text.indexOf('ZAWIADOMIENIE');
    const items = text.indexOf('Opis');
    expect(title).toBeLessThan(header);
    expect(header).toBeLessThan(items);
  });

  it('omits missing header, footer and HOA name without placeholders', () => {
    render(
      <NoticePdfDocument
        apartments={[
          apartment({ hoaHeader: null, hoaFooter: null, hoaName: null }),
        ]}
        generatedDate="2026-10-30"
      />
    );

    const page = screen.getByTestId('pdf-page');
    expect(page).not.toHaveTextContent('ZAWIADOMIENIE');
    expect(page).not.toHaveTextContent('Konto');
    expect(page).toHaveTextContent('Wygenerowano: 2026-10-30');
    expect(page).not.toHaveTextContent('null');
  });
});
